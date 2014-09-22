// Start
var piREST = require('./../index.js');

piREST.set_id('34f5eQ');
piREST.set_name('my_new_Pi');

temperature = 24;
humidity = 24;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);