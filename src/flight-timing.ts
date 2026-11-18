export const flightTiming={runway:1.8,liftoff:4.65,climb:3.75,fade:.85} as const;
export const takeoffDuration=flightTiming.liftoff+flightTiming.climb+flightTiming.fade;
export const landingTiming={touchdown:3.9,exit:5.8} as const;
export type FlightMode='takeoff'|'landing';
export function flightEnvelope(mode:FlightMode){
  return mode==='takeoff'?
    [[0,68,.025,400],[flightTiming.runway,94,.055,700],[flightTiming.liftoff,174,.14,1700],[7.6,142,.105,1100],[takeoffDuration,124,0,850]]:
    [[0,142,.09,1100],[2.6,112,.07,800],[landingTiming.touchdown,92,.13,1300],[4.5,78,.06,550],[landingTiming.exit,66,0,380]];
}
