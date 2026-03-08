import * as migration_20260220_172034_add_conditional_and_user_fields from './20260220_172034_add_conditional_and_user_fields';
import * as migration_20260221_143721 from './20260221_143721';
import * as migration_20260307_175247 from './20260307_175247';

export const migrations = [
  {
    up: migration_20260220_172034_add_conditional_and_user_fields.up,
    down: migration_20260220_172034_add_conditional_and_user_fields.down,
    name: '20260220_172034_add_conditional_and_user_fields',
  },
  {
    up: migration_20260221_143721.up,
    down: migration_20260221_143721.down,
    name: '20260221_143721',
  },
  {
    up: migration_20260307_175247.up,
    down: migration_20260307_175247.down,
    name: '20260307_175247'
  },
];
