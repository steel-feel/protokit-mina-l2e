import {  Character, CircuitString, Struct } from "o1js";
import { UInt64,  } from "@proto-kit/library";

export class securityCode extends Struct({
 char1 : Character,
 char2 : Character
}) {}

export class message extends Struct({
  sno: UInt64,
  agentId: UInt64,
  content: CircuitString,  
  securityCode,
}) {}