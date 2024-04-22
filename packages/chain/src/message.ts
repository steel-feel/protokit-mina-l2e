import { Bool, Character, CircuitString, Field, MerkleMap, MerkleTree, MerkleWitness, PublicKey, Struct, UInt32 } from "o1js";
import { UInt64, } from "@proto-kit/library";
import { assert } from "@proto-kit/protocol";

export class SecurityCode extends Struct({
  char1: Character,
  char2: Character
}) { }

export class AgentDetails extends Struct({
  securityCode1: Character,
  securityCode2: Character,
  lastMessageNo: UInt64
}) { }

export class MessageStruct extends Struct({
  content: CircuitString
}){
  constructor(content: string) {

    const len = content.length
    assert(Bool(len <= 12), "message length greater than 12")
    super({content : CircuitString.fromString(content) })
 
  }
}

export class Message extends Struct({
  sno: UInt64,
  agentId: UInt64,
  content: MessageStruct,
  securityCode: SecurityCode,
}) { }


export class ExtendedAgentDetails extends Struct({
  securityCode1: Character,
  securityCode2: Character,
  root: Field,
  sender: PublicKey,
  blockHeight: UInt64,
  nonce: UInt64
}) { }

export const messagesMap = new MerkleMap();

export class MessageVerificationInput extends Struct({
  securityCode1: Character,
  securityCode2: Character,
  root: Field
}){}


// create a new tree
export const height = 20;
export const messagesTree = new MerkleTree(height);
export class MerkleWitness20 extends MerkleWitness(height) {}