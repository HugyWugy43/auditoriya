CREATE TABLE legacy_import_receipts (
 fingerprint varchar(64) PRIMARY KEY,
 imported_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
