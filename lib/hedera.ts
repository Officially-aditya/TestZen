import {
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  Hbar,
  Status,
} from '@hashgraph/sdk';

let client: Client | null = null;

export function getHederaClient(): Client {
  if (!client) {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    if (!operatorId || !operatorKey) {
      throw new Error('Hedera operator credentials not configured');
    }

    try {
      if (network === 'mainnet') {
        client = Client.forMainnet();
      } else {
        client = Client.forTestnet();
      }

      client.setOperator(
        AccountId.fromString(operatorId),
        PrivateKey.fromString(operatorKey)
      );
    } catch (error) {
      console.error('Error initializing Hedera client:', error);
      throw new Error('Failed to initialize Hedera client');
    }
  }

  return client;
}

export function validateTokenId(tokenId: string): boolean {
  try {
    TokenId.fromString(tokenId);
    return true;
  } catch {
    return false;
  }
}

export function validateAccountId(accountId: string): boolean {
  try {
    AccountId.fromString(accountId);
    return true;
  } catch {
    return false;
  }
}

export interface MintNFTResult {
  tokenId: string;
  serialNumber: number;
  transactionId: string;
  timestamp: Date;
}

export async function mintNFT(
  recipientAccountId: string,
  metadataCID: string
): Promise<MintNFTResult> {
  const client = getHederaClient();
  const tokenId = process.env.HEDERA_NFT_TOKEN_ID;

  if (!tokenId) {
    throw new Error('HEDERA_NFT_TOKEN_ID not configured');
  }

  if (!validateTokenId(tokenId)) {
    throw new Error('Invalid token ID format');
  }

  if (!validateAccountId(recipientAccountId)) {
    throw new Error('Invalid recipient account ID format');
  }

  try {
    // Mint the NFT with metadata CID
    const metadata = Buffer.from(metadataCID);
    
    const mintTx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([metadata])
      .freezeWith(client);

    const mintTxSign = await mintTx.sign(
      PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!)
    );
    const mintTxSubmit = await mintTxSign.execute(client);
    const mintReceipt = await mintTxSubmit.getReceipt(client);

    if (mintReceipt.status !== Status.Success) {
      throw new Error(`Mint failed with status: ${mintReceipt.status}`);
    }

    const serialNumber = mintReceipt.serials[0].toNumber();

    // Transfer the NFT to the recipient
    // Note: This assumes the recipient has already associated the token
    // In production, you may want to check this or handle association
    const transferTx = await new TransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenId),
        serialNumber,
        client.operatorAccountId!,
        AccountId.fromString(recipientAccountId)
      )
      .freezeWith(client);

    const transferTxSign = await transferTx.sign(
      PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!)
    );
    const transferTxSubmit = await transferTxSign.execute(client);
    const transferReceipt = await transferTxSubmit.getReceipt(client);

    if (transferReceipt.status !== Status.Success) {
      throw new Error(`Transfer failed with status: ${transferReceipt.status}`);
    }

    return {
      tokenId,
      serialNumber,
      transactionId: mintTxSubmit.transactionId.toString(),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function associateToken(
  accountId: string,
  accountKey: string,
  tokenId: string
): Promise<string> {
  const client = getHederaClient();

  try {
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)])
      .freezeWith(client);

    const associateTxSign = await associateTx.sign(
      PrivateKey.fromString(accountKey)
    );
    const associateTxSubmit = await associateTxSign.execute(client);
    const associateReceipt = await associateTxSubmit.getReceipt(client);

    if (associateReceipt.status !== Status.Success) {
      throw new Error(`Association failed with status: ${associateReceipt.status}`);
    }

    return associateTxSubmit.transactionId.toString();
  } catch (error) {
    console.error('Error associating token:', error);
    throw new Error(`Failed to associate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface HCSMessageData {
  sessionId: string;
  userId: string;
  mode: string;
  duration: number;
  xpEarned: number;
  reflectionHash?: string;
  reflectionCID?: string;
  timestamp: string;
}

export interface HCSMessageResult {
  transactionId: string;
  topicId: string;
  timestamp: Date;
  sequenceNumber: number;
}

/**
 * Submit a message to Hedera Consensus Service (HCS) topic
 * @param topicId - The HCS topic ID
 * @param messageData - The session data to submit
 * @returns Transaction details
 */
export async function submitHCSMessage(
  topicId: string,
  messageData: HCSMessageData
): Promise<HCSMessageResult> {
  const client = getHederaClient();

  if (!topicId) {
    throw new Error('HCS topic ID not provided');
  }

  try {
    // Convert message data to JSON string
    const messageJSON = JSON.stringify(messageData);
    const messageBytes = Buffer.from(messageJSON, 'utf-8');

    // Submit message to topic
    const submitTx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(messageBytes)
      .execute(client);

    const receipt = await submitTx.getReceipt(client);

    if (receipt.status !== Status.Success) {
      throw new Error(`HCS message submission failed with status: ${receipt.status}`);
    }

    return {
      transactionId: submitTx.transactionId.toString(),
      topicId,
      timestamp: new Date(),
      sequenceNumber: receipt.topicSequenceNumber?.toNumber() || 0,
    };
  } catch (error) {
    console.error('Error submitting HCS message:', error);
    throw new Error(`Failed to submit HCS message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate HCS topic ID format
 */
export function validateTopicId(topicId: string): boolean {
  try {
    TopicId.fromString(topicId);
    return true;
  } catch {
    return false;
  }
}
