export const ENTITY_CSV = `entity_id,entity_name,entity_type
pc_st_100_000000,STEP1,PC_ST
pc_lo_100_000000,IF(1),PC_LO
pc_lo_100_a00000,AND(1.a),PC_LO
ic_000001,FEEDWATER LOW FLOW Annunciator,IC
pc_ft_100_aa0000,illuminated,PC_FT
ic_100001,Feedwater Flow Meter,IC
pc_ft_100_ab0000,1000 L/sec,PC_FT
pc_st_200_000000,STEP2,PC_ST
pc_lo_200_a00000,IF(2.a),PC_LO
pc_ft_200_aa0000,1000 L/sec,PC_FT
ct_000001,Feedwater Control Valve,CT
pc_ft_200_aba000,manual mode,PC_FT
pc_ft_200_abb000,fully open to 100%,PC_FT
pc_lo_200_b00000,IF(2.b),PC_LO
pc_ft_200_ba0000,restored,PC_FT
pc_st_300_000000,STEP3,PC_ST
pc_lo_300_a00000,IF(3.a),PC_LO
ct_000002,Feedwater Pump Switch,CT
pc_ft_300_aa0000,off,PC_FT
ct_000003,Feedwater Pump Switch Start Button,CT
pc_ft_300_ac0000,on,PC_FT
pc_lo_300_b00000,IF(3.b),PC_LO
pc_lo_300_ba0000,OR(3.b.a),PC_LO
pc_ft_300_baa000,on,PC_FT
pc_ft_300_bab000,restored,PC_FT
pc_st_400_000000,STEP4,PC_ST
pc_in_400_a00000,proceed to a rapid shutdown,PC_IN
pc_st_410_000000,STEP4.1,PC_ST
ct_000004,Turbine Bypass Control Valve,CT
pc_ft_410_aa0000,0%,PC_FT
pc_ft_410_ab0000,10%,PC_FT
pc_lo_410_b00000,IF(4.1.b),PC_LO
pc_lo_410_ba0000,AND(4.1.b.a),PC_LO
pc_ft_410_baa000,10%,PC_FT
ic_100002,Reactor Core Temperature Meter,IC
pc_ft_410_bab000,decreasing,PC_FT
pc_st_420_000000,STEP4.2,PC_ST
pc_lo_420_a00000,IF(4.2.a),PC_LO
ic_100003,Turbine Speed Meter,IC
pc_ft_420_aa0000,0m/sec,PC_FT
ct_000005,Trip Turbine Button,CT
pc_lo_420_b00000,IF(4.2.b),PC_LO
pc_lo_420_ba0000,AND(4.2.b.a),PC_LO
ct_000006,Turbine Speed Control Valve,CT
pc_ft_420_baa000,closed(0%),PC_FT
ct_000007,Turbine Load Control Valve,CT
pc_ft_420_bab000,closed(0%),PC_FT
pc_st_430_000000,STEP4.3,PC_ST
pc_lo_430_a00000,IF(4.3.a),PC_LO
ic_100004,Reactor Reactivity Meter,IC
pc_ft_430_aa0000,0%,PC_FT
ct_000008,Trip Reactor Button,CT
pc_lo_430_b00000,IF(4.3.b),PC_LO
pc_lo_430_ba0000,AND(4.3.b.a),PC_LO
ic_000002,ALL RODS DOWN annunciator,IC
pc_ft_430_baa000,illuminated,PC_FT
pc_ft_430_bab000,0%,PC_FT
pc_st_440_000000,STEP4.4,PC_ST
ct_000009,Activate Safety Injection Button,CT
pc_lo_440_b00000,IF(4.4.b),PC_LO
ic_000003,SAFETY INJECTION ENGAGED annunciator,IC
pc_ft_440_ba0000,illuminated,PC_FT
pc_st_450_000000,STEP4.5,PC_ST
pc_in_450_a00000,Reactor Core Temperature should be rapidly decreasing,PC_IN
pc_lo_450_b00000,IF(4.5.b),PC_LO
pc_ft_450_ba0000,392F degree,PC_FT
ct_000010,Power Operated Relief Valve Isolation Valve Close Button,CT
ct_000011,Power Operated Relief Valve Isolation Valve,CT
pc_ft_450_bc0000,closed,PC_FT
pc_lo_450_c00000,IF(4.5.c),PC_LO
pc_ft_450_ca0000,392F degree,PC_FT
pc_st_460_000000,STEP4.6,PC_ST
pc_in_460_a00000,Proceed additional steps to reduce the Reactor Core Temperature,PC_IN
pc_st_461_000000,STEP4.6.1,PC_ST
ct_000012,Recirculation Coolant Pump Switch Stop Button,CT
pc_lo_461_b00000,IF(4.6.1.b),PC_LO
ct_000013,Recirculation Coolant Pump Switch,CT
pc_ft_461_ba0000,off,PC_FT
pc_st_462_000000,STEP4.6.2,PC_ST
pc_in_462_a00000,"To stabilize the plant, the Reactor Core Temperature should be maintained below 250F degree",PC_IN
pc_lo_462_b00000,IF(4.6.2.b),PC_LO
pc_ft_462_ba0000,250F degree,PC_FT
pc_ft_462_bb0000,100%,PC_FT
pc_lo_462_c00000,IF(4.6.2.c),PC_LO
pc_ft_462_ca0000,250F degree,PC_FT
pc_ft_462_cb0000,0%,PC_FT`;

export const RELATIONSHIP_CSV = `src_id,dst_id,edge_name,edge_type,class_num
pc_st_100_000000,pc_lo_100_000000,go_to,others,pc_100_000000
pc_lo_100_000000,pc_lo_100_a00000,verify,action,pc_100_a00000
pc_lo_100_a00000,ic_000001,go_to,others,pc_100_aa0000
ic_000001,pc_ft_100_aa0000,is,relationship,pc_100_aa0000
pc_lo_100_a00000,ic_100001,go_to,others,pc_100_ab0000
ic_100001,pc_ft_100_ab0000,is_less_than,relationship,pc_100_ab0000
pc_lo_100_000000,pc_st_200_000000,move_to,action,pc_100_b00000
pc_st_200_000000,pc_lo_200_a00000,go_to,others,pc_200_a00000
pc_lo_200_a00000,ic_100001,verify,action,pc_200_aa0000
ic_100001,pc_ft_200_aa0000,is_less_than,relationship,pc_200_aa0000
pc_lo_200_a00000,ct_000001,turn,action,pc_200_ab0000
ct_000001,pc_ft_200_aba000,into,relationship,pc_200_aba000
ct_000001,pc_ft_200_abb000,into,relationship,pc_200_abb000
pc_st_200_000000,pc_lo_200_b00000,go_to,others,pc_200_b00000
pc_lo_200_b00000,ic_100001,verify,action,pc_200_ba0000
ic_100001,pc_ft_200_ba0000,is_not,relationship,pc_200_ba0000
pc_lo_200_b00000,pc_st_300_000000,move_to,action,pc_200_bb0000
pc_st_300_000000,pc_lo_300_a00000,go_to,others,pc_300_a00000
pc_lo_300_a00000,ct_000002,verify,action,pc_300_aa0000
ct_000002,pc_ft_300_aa0000,is,relationship,pc_300_aa0000
pc_lo_300_a00000,ct_000003,press,action,pc_300_ab0000
pc_lo_300_a00000,ct_000002,verify,action,pc_300_ac0000
ct_000002,pc_ft_300_ac0000,is,relationship,pc_300_ac0000
pc_st_300_000000,pc_lo_300_b00000,go_to,others,pc_300_b00000
pc_lo_300_b00000,pc_lo_300_ba0000,verify,action,pc_300_ba0000
pc_lo_300_ba0000,ct_000002,go_to,others,pc_300_baa000
ct_000002,pc_ft_300_baa000,is_not,relationship,pc_300_baa000
pc_lo_300_ba0000,ic_100001,go_to,others,pc_300_bab000
ic_100001,pc_ft_300_bab000,is_not,relationship,pc_300_bab000
pc_lo_300_b00000,pc_st_400_000000,move_to,action,pc_300_bb0000
pc_st_400_000000,pc_in_400_a00000,read_the_info,action,pc_400_a00000
pc_st_400_000000,pc_st_410_000000,move_to,action,pc_400_b00000
pc_st_410_000000,ct_000004,adjust,action,pc_410_a00000
ct_000004,pc_ft_410_aa0000,from,relationship,pc_410_aa0000
ct_000004,pc_ft_410_ab0000,to,relationship,pc_410_ab0000
pc_st_410_000000,pc_lo_410_b00000,go_to,others,pc_410_b00000
pc_lo_410_b00000,pc_lo_410_ba0000,verify,action,pc_410_ba0000
pc_lo_410_ba0000,ct_000004,go_to,others,pc_410_baa000
ct_000004,pc_ft_410_baa000,is_adjusted_to,relationship,pc_410_baa000
pc_lo_410_ba0000,ic_100002,go_to,others,pc_410_bab000
ic_100002,pc_ft_410_bab000,is,relationship,pc_410_bab000
pc_lo_410_b00000,pc_st_420_000000,move_to,action,pc_410_bb0000
pc_st_420_000000,pc_lo_420_a00000,go_to,others,pc_420_a00000
pc_lo_420_a00000,ic_100003,verify,action,pc_420_aa0000
ic_100003,pc_ft_420_aa0000,is_larger_than,relationship,pc_420_aa0000
pc_lo_420_a00000,ct_000005,press,action,pc_420_ab0000
pc_st_420_000000,pc_lo_420_b00000,go_to,others,pc_420_b00000
pc_lo_420_b00000,pc_lo_420_ba0000,verify,action,pc_420_ba0000
pc_lo_420_ba0000,ct_000006,go_to,others,pc_420_baa000
ct_000006,pc_ft_420_baa000,is,relationship,pc_420_baa000
pc_lo_420_ba0000,ct_000007,go_to,others,pc_420_bab000
ct_000007,pc_ft_420_bab000,is,relationship,pc_420_bab000
pc_lo_420_b00000,pc_st_430_000000,move_to,action,pc_420_bb0000
pc_st_430_000000,pc_lo_430_a00000,go_to,others,pc_430_a00000
pc_lo_430_a00000,ic_100004,verify,action,pc_430_aa0000
ic_100004,pc_ft_430_aa0000,is_larger_than,relationship,pc_430_aa0000
pc_lo_430_a00000,ct_000008,press,action,pc_430_ab0000
pc_st_430_000000,pc_lo_430_b00000,go_to,others,pc_430_b00000
pc_lo_430_b00000,pc_lo_430_ba0000,verify,action,pc_430_ba0000
pc_lo_430_ba0000,ic_000002,go_to,others,pc_430_baa000
ic_000002,pc_ft_430_baa000,is,relationship,pc_430_baa000
pc_lo_430_ba0000,ic_100004,go_to,others,pc_430_bab000
ic_100004,pc_ft_430_bab000,is,relationship,pc_430_bab000
pc_lo_430_b00000,pc_st_440_000000,move_to,action,pc_430_bb0000
pc_st_440_000000,ct_000009,press,action,pc_440_a00000
pc_st_440_000000,pc_lo_440_b00000,go_to,others,pc_440_b00000
pc_lo_440_b00000,ic_000003,verify,action,pc_440_ba0000
ic_000003,pc_ft_440_ba0000,is,relationship,pc_440_ba0000
pc_lo_440_b00000,pc_st_450_000000,move_to,action,pc_440_bb0000
pc_st_450_000000,pc_in_450_a00000,read_the_info,action,pc_450_a00000
pc_st_450_000000,pc_lo_450_b00000,go_to,others,pc_450_b00000
pc_lo_450_b00000,ic_100002,verify,action,pc_450_ba0000
ic_100002,pc_ft_450_ba0000,is_below_than,relationship,pc_450_ba0000
pc_lo_450_b00000,ct_000010,press,action,pc_450_bb0000
pc_lo_450_b00000,ct_000011,verify,action,pc_450_bc0000
ct_000011,pc_ft_450_bc0000,is,relationship,pc_450_bc0000
pc_st_450_000000,pc_lo_450_c00000,go_to,others,pc_450_c00000
pc_lo_450_c00000,ic_100002,verify,action,pc_450_ca0000
ic_100002,pc_ft_450_ca0000,is_over_than,relationship,pc_450_ca0000
pc_lo_450_c00000,pc_st_460_000000,move_to,action,pc_450_cb0000
pc_st_460_000000,pc_in_460_a00000,read_the_info,action,pc_460_a00000
pc_st_460_000000,pc_st_461_000000,move_to,action,pc_460_b00000
pc_st_461_000000,ct_000012,press,action,pc_461_a00000
pc_st_461_000000,pc_lo_461_b00000,go_to,others,pc_461_b00000
pc_lo_461_b00000,ct_000013,verify,action,pc_461_ba0000
ct_000013,pc_ft_461_ba0000,is_in,relationship,pc_461_ba0000
pc_lo_461_b00000,pc_st_462_000000,move_to,action,pc_461_bb0000
pc_st_462_000000,pc_in_462_a00000,read_the_info,action,pc_462_a00000
pc_st_462_000000,pc_lo_462_b00000,go_to,others,pc_462_b00000
pc_lo_462_b00000,ic_100002,verify,action,pc_462_ba0000
ic_100002,pc_ft_462_ba0000,is_over_than,relationship,pc_462_ba0000
pc_lo_462_b00000,ct_000004,slowly_adjust,action,pc_462_bb0000
ct_000004,pc_ft_462_bb0000,up_to,relationship,pc_462_bb0000
pc_st_462_000000,pc_lo_462_c00000,go_to,others,pc_462_c00000
pc_lo_462_c00000,ic_100002,verify,action,pc_462_ca0000
ic_100002,pc_ft_462_ca0000,is_below_than,relationship,pc_462_ca0000
pc_lo_462_c00000,ct_000004,return,action,pc_462_cb0000
ct_000004,pc_ft_462_cb0000,to,relationship,pc_462_cb0000`;

export const PARENT_CSV = `parent_id,child_id
ct_000002,ct_000003
ct_000011,ct_000010`;
