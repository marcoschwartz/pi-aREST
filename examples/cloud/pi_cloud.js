// Start
var piREST = require('./../../index.js')(app);

piREST.set_id('p5dgwt');
piREST.set_name('dummy');

temperature = 24;
humidity = 40;
piREST.variable('temperature',temperature);
piREST.variable('humidity',humidity);

// Connect to cloud.aREST.io
piREST.connect();
