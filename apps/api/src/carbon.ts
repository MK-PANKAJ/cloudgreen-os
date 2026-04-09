import axios from 'axios';
import { Kafka, Partitioners } from 'kafkajs'; // <-- Add Partitioners here

const kafka = new Kafka({
  clientId: 'cloudgreen-ingestor',
  brokers: ['127.0.0.1:9092']
});

// Configure the producer for reliability: retry policy + acks=-1 (all replicas)
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  retry: {
    initialRetryTime: 100,
    retries: 5 // Retry up to 5 times if Kafka is temporarily down
  }
});

export async function publishCarbonSignal(data: any) {
  try {
    await producer.connect();
    await producer.send({
      topic: 'carbon-events',
      acks: -1, // Wait for ALL Kafka replicas to acknowledge (Zero Data Loss)
      messages: [
        { value: JSON.stringify({ timestamp: new Date().toISOString(), ...data }) },
      ],
    });
    console.log("📡 [Kafka] Signal reliably published to carbon-events");
  } catch (error) {
    console.error("🚨 [Kafka] CRITICAL: Failed to publish signal after 5 retries.", error);
    // In production: write to fallback database (Postgres) here
    // For MVP: log and continue
  } finally {
    await producer.disconnect();
  }
}

// apps/api/src/carbon.ts
export async function getEstimatedCarbonIntensity(lat: number, lon: number) {
  try {
    // Public live carbon intensity feed with no API key required.
    // This keeps the dashboard API-only and avoids synthetic fallback data.
    const res = await axios.get('https://api.carbonintensity.org.uk/intensity', { timeout: 5000 });
    const current = res.data?.data?.[0]?.intensity;
    const intensity = Number(current?.actual ?? current?.forecast);

    if (!Number.isFinite(intensity)) {
      throw new Error('Carbon Intensity API returned an invalid intensity value');
    }

    let mode = 'Balanced';
    if (intensity <= 220) mode = 'Green';
    else if (intensity >= 500) mode = 'Critical';
    else if (intensity > 360) mode = 'Defer';

    return {
      intensity: Math.round(intensity),
      mode,
      wind_speed_10m: 'N/A',
      temperature_2m: 'N/A',
      source: 'Carbon Intensity API (uk)',
    };
  } catch (error) {
    console.error('Carbon Intensity API request failed', error);
    throw new Error('Live carbon API unavailable');
  }
}