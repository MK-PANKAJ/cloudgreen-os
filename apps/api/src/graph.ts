import neo4j from 'neo4j-driver';

// Connect to the local Neo4j container
const driver = neo4j.driver(
  'bolt://127.0.0.1:7687',
  neo4j.auth.basic('neo4j', 'cloudgreen')
);

// 1. Seed the Database with a Supply Chain Network
export async function seedSupplyChainGraph() {
  const session = driver.session();
  try {
    console.log("🕸️ [Graph] Seeding Supplier Network...");
    await session.run(`
      MERGE (hq:Enterprise {name: 'CloudGreen Corp'})
      MERGE (t1a:Supplier {name: 'Green Steel Co', emissions: 450.5, tier: 1})
      MERGE (t1b:Supplier {name: 'Eco Logistics', emissions: 120.0, tier: 1})
      MERGE (t2a:Supplier {name: 'Raw Ore Miners Ltd', emissions: 800.2, tier: 2})
      
      MERGE (hq)-[:BUYS_FROM]->(t1a)
      MERGE (hq)-[:BUYS_FROM]->(t1b)
      MERGE (t1a)-[:BUYS_FROM]->(t2a)
    `);
    console.log("🕸️ [Graph] Network Seeded Successfully.");
  } finally {
    await session.close();
  }
}

// 2. Execute an Exposure Query
export async function calculateScope3Exposure() {
  const session = driver.session();
  try {
    // Cypher query to calculate total emissions across all supplier tiers
    const result = await session.run(`
      MATCH (hq:Enterprise {name: 'CloudGreen Corp'})-[:BUYS_FROM*1..3]->(s:Supplier)
      RETURN sum(s.emissions) as totalScope3, collect(s.name) as suppliers
    `);
    
    const record = result.records[0];
    if (!record) {
      return {
        totalScope3: 0,
        suppliers: [] as string[],
      };
    }

    return {
      totalScope3: record.get('totalScope3'),
      suppliers: record.get('suppliers')
    };
  } finally {
    await session.close();
  }
}