import { createSchema, createYoga } from 'graphql-yoga';
import { getEstimatedCarbonIntensity } from './carbon.js';
import { calculateScope3Exposure } from './graph.js';
import { ethers } from 'ethers';

// Connect to the local Hardhat node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const abi = ["function balanceOf(address account) view returns (uint256)"];
type TokenContract = {
  balanceOf: (account: string) => Promise<bigint>;
};
const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider) as unknown as TokenContract;

const schema = createSchema({
  typeDefs: `
    type Query {
      gridTelemetry: Telemetry
      enterpriseExposure: Exposure
      tokenBalance(wallet: String!): String
    }
    type Telemetry { intensity: Int, mode: String, source: String }
    type Exposure { totalScope3: Float, suppliers: [String] }
  `,
  resolvers: {
    Query: {
      gridTelemetry: async () => {
        const data = await getEstimatedCarbonIntensity(52.52, 13.41);
        return { intensity: data.intensity, mode: data.mode, source: data.source };
      },
      enterpriseExposure: async () => {
        const exposure = await calculateScope3Exposure();
        return { totalScope3: exposure.totalScope3, suppliers: exposure.suppliers };
      },
      tokenBalance: async (_, { wallet }) => {
        const balance = await tokenContract.balanceOf(wallet);
        return ethers.formatUnits(balance, 18); // Convert wei to GCRD
      }
    }
  }
});

// Export the Yoga instance configured for Fastify
export const yoga = createYoga({ schema, graphqlEndpoint: '/graphql' });