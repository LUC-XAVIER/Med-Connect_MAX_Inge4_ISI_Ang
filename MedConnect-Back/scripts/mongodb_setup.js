// use medconnect_db;

// Medical Records Collection
db.createCollection("medical_records");
db.medical_records.createIndex({ "patient_id": 1, "record_date": -1 });
db.medical_records.createIndex({ "patient_id": 1, "record_type": 1 });
db.medical_records.createIndex({ "created_at": -1 });