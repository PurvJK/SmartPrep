import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { normalizeMongoUri } from '../config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.resolve(__dirname, '../load-test/students.csv');
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Password123!';
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE || 500);

function parseStudents(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  const [, ...rows] = lines;

  return rows.slice(0, BATCH_SIZE).map((line) => {
    const [studentId = '', name = '', email = ''] = line.split(',').map((value) => value.trim());
    return { studentId, name, email };
  });
}

async function main() {
  const rawMongoUri = process.env.MONGODB_URI?.trim();
  if (!rawMongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const mongoUri = normalizeMongoUri(rawMongoUri);

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const students = parseStudents(csvText);
  const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, 2);

  await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000
  });

  const operations = students.map((student) => ({
    updateOne: {
      filter: { email: student.email },
      update: {
        $setOnInsert: {
          name: student.name,
          email: student.email,
          password: passwordHash,
          role: 'student',
          isActive: true,
          avatar: '',
          profile: {
            studentId: student.studentId
          }
        }
      },
      upsert: true
    }
  }));

  const result = await User.bulkWrite(operations, { ordered: false });

  console.log(`Seeded ${students.length} student accounts`);
  console.log(`Inserted: ${result.upsertedCount || 0}`);
  console.log(`Matched: ${result.matchedCount || 0}`);
  console.log(`Modified: ${result.modifiedCount || 0}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Student seeding failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});