const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/barbershop';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('barbershop');
    const schedulesCol = db.collection('schedules');
    const appointmentsCol = db.collection('appointments');

    const schedules = await schedulesCol.find({}).toArray();
    console.log('\n--- SCHEDULES ---');
    console.log(JSON.stringify(schedules, null, 2));

    const appointments = await appointmentsCol.find({ status: { $in: ['Pending', 'Accepted'] } }).toArray();
    console.log('\n--- APPOINTMENTS ---');
    console.log(JSON.stringify(appointments.map(a => ({
      _id: a._id,
      status: a.status,
      requestedStart: a.requestedStart,
      requestedEnd: a.requestedEnd
    })), null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
