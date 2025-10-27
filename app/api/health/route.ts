import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getHederaClient } from '@/lib/hedera';
import { HTTP_STATUS } from '@/utils/constants';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    mongodb: {
      status: 'connected' | 'disconnected' | 'error';
      message?: string;
    };
    hedera: {
      status: 'configured' | 'not_configured' | 'error';
      message?: string;
    };
    web3Storage: {
      status: 'configured' | 'not_configured';
      message?: string;
    };
  };
  environment: {
    nodeEnv: string;
    nextVersion?: string;
  };
}

/**
 * Health check endpoint to verify service connectivity and configuration
 * GET /api/health
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        status: 'disconnected',
      },
      hedera: {
        status: 'not_configured',
      },
      web3Storage: {
        status: 'not_configured',
      },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };

  // Check MongoDB connection
  try {
    const mongoose = await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      response.services.mongodb.status = 'connected';
      response.services.mongodb.message = 'MongoDB connection successful';
    } else {
      response.services.mongodb.status = 'disconnected';
      response.services.mongodb.message = 'MongoDB connection not ready';
      response.status = 'degraded';
    }
  } catch (error) {
    response.services.mongodb.status = 'error';
    response.services.mongodb.message = error instanceof Error ? error.message : 'Unknown error';
    response.status = 'unhealthy';
  }

  // Check Hedera configuration
  try {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    
    if (!operatorId || !operatorKey) {
      response.services.hedera.status = 'not_configured';
      response.services.hedera.message = 'Hedera credentials not configured';
      response.status = 'degraded';
    } else {
      // Try to instantiate client to verify credentials format
      try {
        getHederaClient();
        response.services.hedera.status = 'configured';
        response.services.hedera.message = 'Hedera client configured successfully';
      } catch (error) {
        response.services.hedera.status = 'error';
        response.services.hedera.message = error instanceof Error ? error.message : 'Invalid Hedera credentials';
        response.status = 'degraded';
      }
    }
  } catch (error) {
    response.services.hedera.status = 'error';
    response.services.hedera.message = error instanceof Error ? error.message : 'Unknown error';
    response.status = 'degraded';
  }

  // Check Web3.storage configuration
  try {
    const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
    
    if (!web3StorageToken || web3StorageToken === 'your-web3-storage-api-token') {
      response.services.web3Storage.status = 'not_configured';
      response.services.web3Storage.message = 'Web3.storage token not configured';
    } else {
      response.services.web3Storage.status = 'configured';
      response.services.web3Storage.message = 'Web3.storage token configured';
    }
  } catch (error) {
    response.services.web3Storage.status = 'not_configured';
    response.services.web3Storage.message = error instanceof Error ? error.message : 'Unknown error';
  }

  // Determine appropriate HTTP status code
  let httpStatus: number = HTTP_STATUS.OK;
  if (response.status === 'unhealthy') {
    httpStatus = HTTP_STATUS.SERVICE_UNAVAILABLE;
  } else if (response.status === 'degraded') {
    httpStatus = HTTP_STATUS.OK; // Still return 200 for degraded state
  }

  return NextResponse.json(response, { status: httpStatus });
}
