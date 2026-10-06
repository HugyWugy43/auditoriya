package com.audit.userservice.model;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class UserSerializationTest {
 @Test void passwordCanBeWrittenButNeverRead() throws Exception {
  ObjectMapper mapper = new ObjectMapper();
  User user = mapper.readValue("{\"username\":\"test\",\"password\":\"private-password\"}", User.class);
  assertEquals("private-password", user.getPassword());
  String json = mapper.writeValueAsString(user);
  assertFalse(json.contains("password")); assertFalse(json.contains("private-password"));
 }
}
