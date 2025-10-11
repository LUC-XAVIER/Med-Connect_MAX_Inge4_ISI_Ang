// use medconnect_db;

// Medical Records Collection
db.createCollection("medical_records");
db.medical_records.createIndex({ "patient_id": 1, "record_date": -1 });

// Messages Collection
db.createCollection("messages");
db.messages.createIndex({ "sender_id": 1, "receiver_id": 1 });