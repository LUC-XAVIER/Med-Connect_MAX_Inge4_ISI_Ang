import { getDB } from '../config/mongodb';
import { IMedicalRecord, ICreateMedicalRecord } from '../models/mongodb/Record';
import { ObjectId } from 'mongodb';

export class RecordRepository {
  private readonly collection = 'medical_records';

  async create(recordData: ICreateMedicalRecord): Promise<IMedicalRecord> {
    const db = getDB();
    
    const recordToInsert = {
      ...recordData,
      upload_date: new Date(),
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection(this.collection).insertOne(recordToInsert);

    return {
      ...recordToInsert,
      _id: result.insertedId.toString(),
    } as IMedicalRecord;
  }

  async findById(recordId: string): Promise<IMedicalRecord | null> {
    const db = getDB();
    
    const record = await db.collection(this.collection).findOne({
      _id: new ObjectId(recordId),
      is_deleted: false,
    });

    if (!record) {
      return null;
    }

    return {
      ...record,
      _id: record._id.toString(),
      record_id: record._id.toString(), // Map _id to record_id for frontend
    } as IMedicalRecord;
  }

  async findByPatientId(
    patientId: number,
    filters?: {
      record_type?: string;
      start_date?: Date;
      end_date?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<IMedicalRecord[]> {
    const db = getDB();
    
    const query: any = {
      patient_id: patientId,
      is_deleted: false,
    };

    if (filters?.record_type) {
      query.record_type = filters.record_type;
    }

    if (filters?.start_date || filters?.end_date) {
      query.record_date = {};
      if (filters.start_date) {
        query.record_date.$gte = filters.start_date;
      }
      if (filters.end_date) {
        query.record_date.$lte = filters.end_date;
      }
    }

    const records = await db
      .collection(this.collection)
      .find(query)
      .sort({ record_date: -1 })
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0)
      .toArray();

    return records.map((record) => ({
      ...record,
      _id: record._id.toString(),
      record_id: record._id.toString(), // Map _id to record_id for frontend
    })) as IMedicalRecord[];
  }

  async search(patientId: number, searchTerm: string): Promise<IMedicalRecord[]> {
    const db = getDB();

    const records = await db
      .collection(this.collection)
      .find({
        patient_id: patientId,
        is_deleted: false,
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .sort({ record_date: -1 })
      .toArray();

    return records.map((record) => ({
      ...record,
      _id: record._id.toString(),
      record_id: record._id.toString(), // Map _id to record_id for frontend
    })) as IMedicalRecord[];
  }

  async update(recordId: string, updates: Partial<IMedicalRecord>): Promise<IMedicalRecord | null> {
    const db = getDB();

    const result = await db.collection(this.collection).findOneAndUpdate(
      { _id: new ObjectId(recordId), is_deleted: false },
      {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    return {
      ...result,
      _id: result._id.toString(),
      record_id: result._id.toString(), // Map _id to record_id for frontend
    } as IMedicalRecord;
  }

  async softDelete(recordId: string): Promise<boolean> {
    const db = getDB();

    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(recordId) },
      {
        $set: {
          is_deleted: true,
          updated_at: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  async countByPatientId(patientId: number): Promise<number> {
    const db = getDB();

    return await db.collection(this.collection).countDocuments({
      patient_id: patientId,
      is_deleted: false,
    });
  }

  async getRecordsByType(patientId: number): Promise<any> {
    const db = getDB();

    const pipeline = [
      {
        $match: {
          patient_id: patientId,
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: '$record_type',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await db.collection(this.collection).aggregate(pipeline).toArray();

    return results.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}

export default new RecordRepository();