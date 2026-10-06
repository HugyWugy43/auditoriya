"""Offline legacy migration. Dry run by default; source is never modified.
Requires PostgreSQL psql on PATH. Credentials are read from environment, not arguments.
See docs/HARDENING.md for the maintenance procedure.
"""
import argparse, datetime, hashlib, json, os, pathlib, re, subprocess, sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', required=True, help='Legacy database name')
parser.add_argument('--prefix', default='audit', help='Target database prefix: <prefix>_users, _rooms, _bookings')
parser.add_argument('--backup', required=True, type=pathlib.Path, help='New private backup directory')
parser.add_argument('--apply', action='store_true')
parser.add_argument('--admin-id', type=int, help='Existing administrator ID whose password is reset from MIGRATION_ADMIN_PASSWORD')
parser.add_argument('--psql', default='psql')
args = parser.parse_args()
for value in [args.source, args.prefix]:
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', value): parser.error('Invalid database identifier')

def sql(db, statement):
    run = subprocess.run([args.psql, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', db], input=statement, text=True, encoding='utf-8', capture_output=True)
    if run.returncode:
        # Never echo SQL that may include passwords or personal data.
        raise RuntimeError('Database operation failed. Check connectivity, permissions, schemas and maintenance mode; no SQL or secrets printed.')
    return run.stdout.strip()

def literal(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace("'", "''") + "'"

def insert(table, rows, columns):
    if not rows: return ''
    return 'INSERT INTO ' + table + '(' + ','.join(columns) + ') VALUES\n' + ',\n'.join('(' + ','.join(literal(row.get(c)) for c in columns) + ')' for row in rows) + ';\n'

# Single read-only snapshot across all source tables.
raw = sql(args.source, "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT json_build_object('users',(SELECT coalesce(json_agg(u ORDER BY u.id),'[]'::json) FROM users u),'rooms',(SELECT coalesce(json_agg(r ORDER BY r.id),'[]'::json) FROM rooms r),'bookings',(SELECT coalesce(json_agg(b ORDER BY b.id),'[]'::json) FROM bookings b)); COMMIT;")
data = json.loads(raw)
fingerprint = hashlib.sha256(raw.encode()).hexdigest()
args.backup.mkdir(parents=True, exist_ok=False)
(args.backup / 'source.json').write_text(raw, encoding='utf-8')
users, rooms, bookings = data['users'], data['rooms'], data['bookings']
user_ids, room_ids = {u['id'] for u in users}, {r['id'] for r in rooms}
orphans = [b['id'] for b in bookings if b['user_id'] not in user_ids or b['room_id'] not in room_ids]
invalid_rooms = [r['id'] for r in rooms if not isinstance(r.get('capacity'), int) or r['capacity'] <= 0]
review = {}
for b in bookings:
    if b['start_time'] >= b['end_time']: review[b['id']] = 'Invalid legacy interval'
active = [b for b in bookings if b['status'] in ('PENDING','CONFIRMED')]
by_room = {}
for b in active: by_room.setdefault(b['room_id'], []).append(b)
for group in by_room.values():
    group.sort(key=lambda b: b['start_time'])
    for i, left in enumerate(group):
        for right in group[i+1:]:
            if right['start_time'] >= left['end_time']: break
            if left['start_time'] < right['end_time']:
                review[left['id']] = review[right['id']] = 'Overlapping legacy bookings'
report = {'sourceFingerprint':fingerprint,'counts':{k:len(v) for k,v in data.items()},'bookingsNeedingReview':review,'orphanBookingIds':orphans,'invalidRoomIds':invalid_rooms,'applied':False}
(args.backup / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
if orphans or invalid_rooms: sys.exit('Preflight blocked: inconsistent references or rooms. See report; source and targets unchanged. Repair explicitly before import.')
if not args.apply:
    print('Dry run complete. Backup and review report saved; no database changes.'); sys.exit(0)
password = os.environ.get('MIGRATION_ADMIN_PASSWORD','')
admin = next((u for u in users if u['id']==args.admin_id and u['role']=='ADMIN'),None)
if not admin or len(password)<16 or len(password.encode())>72: sys.exit('Apply requires an existing --admin-id and a new 16–72 byte MIGRATION_ADMIN_PASSWORD.')

# Complete preflight before any target write. Receipts make a partial run resumable.
completed = set()
for table in ['users','rooms','bookings']:
    db = args.prefix+'_'+table
    if sql(db,"SELECT to_regclass('legacy_import_receipts') IS NOT NULL") != 't': sys.exit('Run Flyway migrations with bootstrap disabled on empty target databases first.')
    receipt = sql(db,'SELECT fingerprint FROM legacy_import_receipts LIMIT 1')
    if receipt:
        if receipt != fingerprint: sys.exit('Target contains a different import. Refusing to overwrite.')
        completed.add(table)
    elif sql(db,'SELECT count(*) FROM '+table) != '0': sys.exit('Target is not empty. Refusing to overwrite.')

for u in users:
    u['active'] = bool(u.get('active',True)) and u['username'] not in ('admin','teacher','student') and bool(re.match(r'^\$2[aby]\$',u['password']))
for r in rooms: r.setdefault('archived',False)
audit = []
for b in bookings:
    b.setdefault('version',0)
    if b['id'] in review:
        audit.append({'booking_id':b['id'],'original_status':b['status'],'reason':review[b['id']],'original_record':json.dumps(b)})
        b['status']='NEEDS_REVIEW'
columns = {
 'users':['id','username','email','password','first_name','last_name','role','active','created_at','updated_at'],
 'rooms':['id','room_number','name','type','capacity','description','is_active','archived','created_at','updated_at'],
 'bookings':['id','version','user_id','room_id','start_time','end_time','purpose','status','created_at','updated_at']}
for table in ['users','rooms','bookings']:
    if table in completed: continue
    statement = 'BEGIN; SET LOCAL standard_conforming_strings=on; LOCK TABLE '+table+' IN ACCESS EXCLUSIVE MODE;\n'
    statement += "DO $$ BEGIN IF EXISTS(SELECT 1 FROM " + table + ") THEN RAISE EXCEPTION 'Target not empty'; END IF; END $$;\n"
    statement += insert(table,data[table],columns[table])
    statement += "SELECT setval(pg_get_serial_sequence('"+table+"','id'),coalesce((SELECT max(id) FROM "+table+"),1),EXISTS(SELECT 1 FROM "+table+"));\n"
    if table=='users':
        statement += "CREATE EXTENSION IF NOT EXISTS pgcrypto; UPDATE users SET active=true,password=crypt("+literal(password)+",gen_salt('bf',12)) WHERE id="+str(admin['id'])+';\n'
    if table=='bookings': statement += insert('legacy_import_audit',audit,['booking_id','original_status','reason','original_record'])
    statement += "INSERT INTO legacy_import_receipts(fingerprint) VALUES ("+literal(fingerprint)+"); COMMIT;"
    sql(args.prefix+'_'+table, statement)
report['applied']=True
(args.backup / 'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Import complete. All records preserved; overlapping/invalid bookings require administrator review. Legacy default accounts disabled; selected administrator password reset.')
