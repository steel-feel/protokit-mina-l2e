import {  CircuitString, PublicKey, Struct } from "o1js";
import { UInt64,  } from "@proto-kit/library";
 
export class message extends Struct({
  sno: UInt64,
  agentId: UInt64,
  content: CircuitString,  
  securityCode: CircuitString,
}) {}