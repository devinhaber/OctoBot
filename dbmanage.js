var tables = {}

var races = ['orc', 'pandaren', 'goblin', 'worgen', 'draenei', 'blood_elf','dwarf',
             'human', 'gnome', 'tauren', 'troll', 'night_elf', 'undead']
var classes = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'death_knight', 'shaman',
               'mage', 'warlock', 'monk', 'demon_hunter', 'druid']
var roles = ['dps', 'tank', 'healer']

var professions = ['engineering', 'tailoring', 'alchemy', 'blacksmithing', 'enchanting', 'herbalism', 'inscription', 'jewelcrafting', 'leatherworking', 'mining', 'skinning', 'none']

exports.setSchema = (orm, db) => {
    var Raider = db.define('raider', {
        id:   {type:'serial', key:true},
        discorduser: {type: 'text'},
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

    db.sync((err) => {if (err) throw err;console.log('DB READY')});
    tables['raid'] = Raid;
    tables['raider'] = Raider;
    tables['schedule'] = Schedule;
    tables['user'] = User;
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

exports.registerRaider = (req, cb) => {
    tables['raider'].create(req.body, (err) => {
        cb(err)
    })
}

exports.registerRaid = (req, cb) => {
    tables['raid'].create(req.body, (err) => {
        cb(err)
    })
}

exports.getRaiders = (cb) => {
    tables['raider'].all(cb)
}

exports.getRaids = (cb) => {
    tables['raid'].all(cb)
}

exports.findRaid = (name, cb) => {
    tables['raid'].one({name: name}, (err, res) => {
        if (res) {
            cb(null, res)
        } else {
            cb(err, null)
        }
    })
}

exports.findRaider = (name ,cb) => {
    tables['raider'].one({name: name}, (err, res) => {
        if (res) {
            cb(null, res)
        } else {
            cb(err, null)
        }
    })
}