import { runtimeModule,RuntimeModule, state, runtimeMethod } from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { UInt64, } from "@proto-kit/library";
import { PublicKey,CircuitString, Bool } from "o1js";

interface BalancesConfig {
    admin: PublicKey;
  }

@runtimeModule()
export class SpyMessages extends RuntimeModule<BalancesConfig> {
  @state() public agents = StateMap.from<UInt64, CircuitString>(
    UInt64,
    CircuitString
  );

  @runtimeMethod()
  public addAgent(
    Id: UInt64,
    code: CircuitString
  ): void {
     //check that it only be accessed by admin
     assert(
        this.transaction.sender.value.equals(this.config.admin),
        "Agent can only be added by Admin"
      );

      //code max length is 2
      assert(
        Bool(code.values.length == 2),
        "Agent can only be added by Admin"
      );
      
      this.agents.set(Id,code);

  }
}
