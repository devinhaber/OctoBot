var tables = {}

var races = ['orc', 'pandaren', 'goblin', 'worgen', 'draenei', 'blood_elf','dwarf',
             'human', 'gnome', 'tauren', 'troll', 'night_elf', 'undead']
var classes = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'death_knight', 'shaman',
               'mage', 'warlock', 'monk', 'demon_hunter', 'druid']
var roles = ['dps', 'tank', 'healer']

var professions = ['engineering', 'tailoring', 'alchemy', 'blacksmithing', 'enchanting', 'herbalism', 'inscription', 'jewelcrafting', 'leatherworking', 'mining', 'skinning']

exports.setSchema = (orm, db) => {
    var Raider = db.define('raider', {
        id:   {type:'serial', key:true},
        realname:    {type: 'text'},
        name:       {type: 'text'},
        realm:      {type: 'text'},
        faction:    {type: 'enum', values: ['alliance', 'horde']},
        race:       {type: 'enum', values: races},
        class:      {type: 'enum', values: classes},
        role:       {type: 'enum', values: roles},
        profession1: {type: "enum", values: professions},
        profession2: {type: "enum", values: professions},
    });
    var Raid = db.define('raid', {
        id:     {type: 'serial', key: true},
        name:   {type: 'text'},
        raid:   {type: 'text'},
    });
    var Schedule = db.define('schedule', {
        id:     {type: 'serial', key: true},
        name:   {type: 'text'},
        time:   {type: 'text'},
    });
    Raid.hasMany('raiders', Raider, {}, {reverse: 'raids', key:true});
    Raid.hasOne('schedule', Schedule, {reverse: 'raid'});

    var User = db.define('user', {
        username: {type: 'text'},
        password: {type: 'text'}
    });

    db.sync((err) => {if (err) throw err;});
    tables['raid'] = Raid;
    tables['raider'] = Raider;
    tables['schedule'] = Schedule;
    tables['user'] = User;
    console.log('DB READY')
}

exports.registerRaider = (userinfo, cb) => {
    console.log("Registering User")
    tables['raider'].create(userinfo, (err) => {cb(err)});
}

// Plaintext passwords :( Not overly important for such a small project - put a warning for users
exports.checkAuth = (req, cb) => {
    tables['user'].one({username: req.body.username},  (err, res) => {
        if (res && req.body.password == res.password) {
            cb(true)
        } else {
            cb(false)
        }
    })
}

exports.registerUser = (username, password, cb) => {
    tables['user'].create({username: username, password: password}, (err) => {
            cb(err)
    })
}
