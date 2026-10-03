/** IPC channel names - short and stable */

export const IPC = {
  CLK_GET: 'clk:get',
  CLK_PLAY: 'clk:play',
  CLK_PAUSE: 'clk:pause',
  CLK_STOP: 'clk:stop',
  CLK_SEEK: 'clk:seek',
  CLK_TICK: 'clk:tick',

  SHOW_GET: 'show:get',
  SHOW_SET: 'show:set',
  SHOW_PUSH: 'show:push',
  SHOW_SAVE: 'show:save',
  SHOW_OPEN: 'show:open',

  MED_IMPORT: 'med:import',
  MED_IMPORT_PATHS: 'med:import:paths',
  MED_PROBE: 'med:probe',

  OUT_STATUS: 'out:status',
  OUT_STATUS_PUSH: 'out:status:push',
  OUT_CFG_GET: 'out:cfg:get',
  OUT_CFG_SET: 'out:cfg:set',
  OUT_PORTS: 'out:ports',
  OUT_USB_ERR: 'out:usb:err',
  OUT_DMX_GET: 'out:dmx:get',
  OUT_DMX_PUSH: 'out:dmx:push',

  WLED_DISCOVER: 'wled:discover',
  WLED_PROBE: 'wled:probe',

  FIX_IMPORT: 'fix:import',
  FIX_LIB_SAVE: 'fix:lib:save',
  FIX_LIB_LOAD: 'fix:lib:load',
  FIX_LIB_SYNC: 'fix:lib:sync',
  FIX_BG_PICK: 'fix:bg:pick',

  STRM_GET: 'strm:get',
  STRM_SET: 'strm:set',

  WIN_PREV: 'win:prev',
  WIN_OUT: 'win:out',
  WIN_OUT_OPEN: 'win:out:open',
  WIN_FIX: 'win:fix',
  WIN_SCH: 'win:sch',

  DISP_LIST: 'disp:list',
  DISP_SET: 'disp:set',

  MED_OUT_GET: 'medOut:get',
  MED_OUT_SET: 'medOut:set',

  TASK_PROGRESS: 'task:progress',
} as const
