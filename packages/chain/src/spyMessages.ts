import { runtimeModule, RuntimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { UInt64, } from "@proto-kit/library";
import { SecurityCode, AgentDetails,MessageStruct } from "./message";


@runtimeModule()
export class SpyMessages extends RuntimeModule<Record<string, never>> {
  //Note: Somehow its not working if fetched inside the method
  @state() public agents = StateMap.from<UInt64,AgentDetails>(
    UInt64,
    AgentDetails
  );


  @runtimeMethod()
  // public addMessage(message: Message): void {
  public addMessage(agentId: UInt64, securityCode: SecurityCode,
     messageContent:MessageStruct, 
    messageNo:UInt64
      )
     : void {
    const someAgent = this.agents.get( UInt64.from( agentId))
    //check if agent exists
    assert(someAgent.isSome, "Agent code is present")
    const agent = new AgentDetails(someAgent.value)
    //check if security code matches
    // const agentDetails = new AgentDetails({...someAgent.value})
    assert(securityCode.char1.equals(agent.securityCode1), "Secuity Code 1 is wrong")
    assert(securityCode.char2.equals(agent.securityCode2), "Secuity Code 2 is wrong")
    //check if message no is greater than current  
    assert(agent.lastMessageNo.lessThan(messageNo), "Message number should be greater")
    //update the message no in state
    agent.lastMessageNo = messageNo
    this.agents.set(agentId,agent)

  }

  @runtimeMethod()
  public addAgent(
    Id: UInt64,
    securityCode: SecurityCode
  ): void {
    //check that it only be accessed by admin
    // assert(
    //   this.transaction.sender.value.equals(this.config.admin),
    //   "Agent can only be added by Admin"
    // );
    var agent = new AgentDetails({
    lastMessageNo : UInt64.from(0),
    securityCode1:securityCode.char1,
    securityCode2:securityCode.char2,
    })
    this.agents.set(Id, agent);
  
  }
}
