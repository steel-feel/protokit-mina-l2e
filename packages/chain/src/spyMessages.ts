import { runtimeModule,RuntimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { UInt64, } from "@proto-kit/library";
import { PublicKey,CircuitString, Bool } from "o1js";
import { securityCode } from "./message";

interface SpyMessagesConfig {
    admin: PublicKey;
  }

@runtimeModule()
export class SpyMessages extends RuntimeModule<SpyMessagesConfig> {
  @state() public agents = StateMap.from<UInt64, securityCode>(
    UInt64,
    securityCode
  );

  @runtimeMethod()
  public addAgent(
    Id: UInt64,
    code: securityCode
  ): void {
     //check that it only be accessed by admin
     assert(
        this.transaction.sender.value.equals(this.config.admin),
        "Agent can only be added by Admin"
      );
      
      this.agents.set(Id,code);

  }
}
