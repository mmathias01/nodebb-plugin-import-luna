
var async = require('async');
var mysql = require('mysql');
var _ = require('underscore');
var noop = function(){};
var logPrefix = '[nodebb-plugin-import-ubb]';

(function(Exporter) {

	Exporter.setup = function(config, callback) {
		Exporter.log('setup');

		// mysql db only config
		// extract them from the configs passed by the nodebb-plugin-import adapter
		var _config = {
			host: config.dbhost || config.host || 'localhost',
			user: config.dbuser || config.user || 'root',
			password: config.dbpass || config.pass || config.password || '',
			port: config.dbport || config.port || 3306,
			database: config.dbname || config.name || config.database || 'ubb'
		};

		Exporter.config(_config);
		Exporter.config('prefix', config.prefix || config.tablePrefix || '');

		Exporter.connection = mysql.createConnection(_config);
		Exporter.connection.connect();

		callback(null, Exporter.config());
	};

	Exporter.getUsers = function(callback) {
		return Exporter.getPaginatedUsers(0, -1, callback);
	};
	Exporter.getPaginatedUsers = function(start, limit, callback) {
		callback = !_.isFunction(callback) ? noop : callback;

		var err;
		var prefix = Exporter.config('prefix');
		var startms = +new Date();
		var query = 'SELECT '
				+ prefix + 'USERS.id as _uid, '
				+ prefix + 'USERS.username as _username, '
				//+ prefix + 'USERS.USER_DISPLAY_NAME as _alternativeUsername, '
				//+ prefix + 'USERS.email as _registrationEmail, '
				//+ prefix + 'USERS.USER_MEMBERSHIP_LEVEL as _level, '
				+ prefix + 'USERS.registered as _joindate, '
				+ prefix + 'BANS.id as _banned, '
				+ prefix + 'USERS.email as _email, '
				+ prefix + 'USERS.signature as _signature, '
				+ prefix + 'USERS.url as _website, '
				+ prefix + 'USERS.title as _occupation, '
				+ prefix + 'USERS.location as _location, '
				//+ prefix + 'USER_PROFILE.USER_AVATAR as _picture, '
				//+ prefix + 'USER_PROFILE.USER_TITLE as _badge, '
				//+ prefix + 'USER_PROFILE.USER_RATING as _reputation, '
				//+ prefix + 'USER_PROFILE.USER_TOTAL_RATES as _profileviews, '
				//+ prefix + 'USER_PROFILE.USER_BIRTHDAY as _birthday, '
				//+ prefix + 'BANNED_USERS.USER_ID as _banned, '
				+ prefix + 'USERS.group_id as _gid, '
				+ prefix + 'USERS.last_comment as _lastposttime,'
            	+ prefix + 'USERS.last_visit as _lastonline '

				+ 'FROM ' + prefix + 'USERS '

				+ 'LEFT JOIN ' + prefix + 'BANS ON ' + prefix + 'BANS.username = ' + prefix + 'USERS.username '
				+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');


		if (!Exporter.connection) {
			err = {error: 'MySQL connection is not setup. Run setup(config) first'};
			Exporter.error(err.error);
			return callback(err);
		}

		Exporter.connection.query(query,
				function(err, rows) {
					if (err) {
						Exporter.error(err);
						return callback(err);
					}

					//normalize here
					var map = {};
					rows.forEach(function(row) {
						// from unix timestamp (s) to JS timestamp (ms)
						row._joindate = ((row._joindate || 0) * 1000) || startms;
                        row._lastposttime = ((row._lastposttime || 0) * 1000) || startms;
                        row._lastonline = ((row._lastonline || 0) * 1000) || startms;

						// lower case the email for consistency
						row._email = (row._email || '').toLowerCase();

						// I don't know about you about I noticed a lot my users have incomplete urls, urls like: http://
						row._picture = Exporter.validateUrl(row._picture);
						row._website = Exporter.validateUrl(row._website);

						row._banned = row._banned ? 1 : 0;

						if (row._gid) {
							row._groups = [row._gid];
						}
						delete row._gid;


						map[row._uid] = row;
					});

					callback(null, map);
				});
	};

	// Exporter.getGroups = function(callback) {
	// 	return Exporter.getPaginatedGroups(0, -1, callback);
	// };
	// Exporter.getPaginatedGroups = function(start, limit, callback) {
	// 	callback = !_.isFunction(callback) ? noop : callback;
    //
	// 	var err;
	// 	var prefix = Exporter.config('prefix');
	// 	var startms = +new Date();
	// 	var query = 'SELECT '
	// 			+ prefix + 'GROUPS.GROUP_ID as _gid, '
	// 			+ prefix + 'GROUPS.GROUP_NAME as _name, '
	// 			+ prefix + 'USER_GROUPS.USER_ID AS _ownerUid '
	// 			+ 'FROM ' + prefix + 'GROUPS '
	// 			+ 'JOIN ' + prefix + 'USER_GROUPS ON ' + prefix + 'USER_GROUPS.GROUP_ID=' + prefix + 'GROUPS.GROUP_ID '
	// 			+ 'GROUP BY ' + prefix + 'GROUPS.GROUP_ID '
	// 			+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');
    //
    //
	// 	if (!Exporter.connection) {
	// 		err = {error: 'MySQL connection is not setup. Run setup(config) first'};
	// 		Exporter.error(err.error);
	// 		return callback(err);
	// 	}
    //
	// 	Exporter.connection.query(query,
	// 			function(err, rows) {
	// 				if (err) {
	// 					Exporter.error(err);
	// 					return callback(err);
	// 				}
	// 				//normalize here
	// 				var map = {};
	// 				rows.forEach(function(row) {
	// 					map[row._uid] = row;
	// 				});
    //
	// 				callback(null, map);
	// 			});
	// };

	Exporter.getCategories = function(callback) {
		return Exporter.getPaginatedCategories(0, -1, callback);
	};
	Exporter.getPaginatedCategories = function(start, limit, callback) {
		callback = !_.isFunction(callback) ? noop : callback;

		var err;
		var prefix = Exporter.config('prefix');
		var startms = +new Date();
		var query = 'SELECT '
				+ prefix + 'FORUMS.id as _cid, '
				+ prefix + 'FORUMS.forum_name as _name, '
				+ prefix + 'FORUMS.forum_desc as _description, '
				//+ prefix + 'FORUMS.FORUM_CREATED_ON as _timestamp '
        	    + prefix + 'FORUMS.color as _bgColor, '
            	+ prefix + 'FORUMS.icon as _icon '
        		+ 'FROM ' + prefix + 'FORUMS '
				+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');


		if (!Exporter.connection) {
			err = {error: 'MySQL connection is not setup. Run setup(config) first'};
			Exporter.error(err.error);
			return callback(err);
		}

		Exporter.connection.query(query,
				function(err, rows) {
					if (err) {
						Exporter.error(err);
						return callback(err);
					}

					//normalize here
					var map = {};
					rows.forEach(function(row) {
						row._name = row._name || 'Untitled Category '
						row._description = row._description || 'No decsciption available';
						row._timestamp = ((row._timestamp || 0) * 1000) || startms;

						map[row._cid] = row;
					});

					callback(null, map);
				});
	};

	Exporter.getTopics = function(callback) {
		return Exporter.getPaginatedTopics(0, -1, callback);
	};
	Exporter.getPaginatedTopics = function(start, limit, callback) {
		callback = !_.isFunction(callback) ? noop : callback;

		var err;
		var prefix = Exporter.config('prefix');
		var startms = +new Date();
		var query =
				'SELECT '
				+ prefix + 'TOPICS.id as _tid, '
				+ prefix + 'TOPICS.subject as _title, '
				+ prefix + 'TOPICS.FORUM_ID as _cid, '
				+ prefix + 'POSTS.commenter_id as _uid, '
				+ prefix + 'POSTS.message as _content, '
				+ prefix + 'TOPICS.num_views as _viewcount, '
				+ prefix + 'TOPICS.commented as _timestamp, '
				+ prefix + 'TOPICS.pinned as _pinned, '
				+ prefix + 'TOPICS.closed as _locked, '
				+ prefix + 'POSTS.edited as _edited, '
				+ prefix + 'POSTS.commenter_ip as _ip '
				+ 'FROM ' + prefix + 'THREADS as TOPICS '
				+ 'JOIN ' + prefix + 'COMMENTS as POSTS  ON ' + prefix + 'POSTS.id=' + prefix + 'TOPICS.first_comment_id '
				+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');

		if (!Exporter.connection) {
			err = {error: 'MySQL connection is not setup. Run setup(config) first'};
			Exporter.error(err.error);
			return callback(err);
		}

		Exporter.connection.query(query,
				function(err, rows) {
					if (err) {
						Exporter.error(err);
						return callback(err);
					}

					//normalize here
					var map = {};

					rows.forEach(function(row) {
						row._title = row._title ? row._title[0].toUpperCase() + row._title.substr(1) : 'Untitled';
						row._timestamp = ((row._timestamp || 0) * 1000) || startms;
						row._edited = row._edited ? row._edited * 1000 : row._edited;

						map[row._tid] = row;
					});

					callback(null, map);
				});
	};

	Exporter.getPosts = function(callback) {
		return Exporter.getPaginatedPosts(0, -1, callback);
	};
	Exporter.getPaginatedPosts = function(start, limit, callback) {
		callback = !_.isFunction(callback) ? noop : callback;

		var err;
		var prefix = Exporter.config('prefix');
		var startms = +new Date();
		var query =
				'SELECT comments.id as _pid, '
				+ 'commenter_id as _uid, '
				+ 'thread_id as _tid, '
				+ 'message as _content, '
				+ 'comments.commented as _timestamp, '
				+ 'edited as _edited, '
				+ 'commenter_ip as _ip, '
				+ 'THREADS.first_comment_id as _first_comment_id '
				+ 'FROM ' + prefix + 'COMMENTS '
            	+ 'LEFT JOIN ' + prefix + 'THREADS ON ' + prefix + 'THREADS.first_comment_id=' + prefix + 'COMMENTS.id '
				+ 'WHERE THREADS.first_comment_id IS NULL '
				+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');
				Exporter.error(query);

		if (!Exporter.connection) {
			err = {error: 'MySQL connection is not setup. Run setup(config) first'};
			Exporter.error(err.error);
			return callback(err);
		}

		Exporter.connection.query(query,
				function(err, rows) {
					if (err) {
						Exporter.error(err);
						return callback(err);
					}

					//normalize here
					var map = {};
					rows.forEach(function(row) {
						row._content = row._content || '';
						row._timestamp = ((row._timestamp || 0) * 1000) || startms;
						row._edited = row._edited ? row._edited * 1000 : row._edited;
						map[row._pid] = row;
					});

					callback(null, map);
				});
	};


	// // todo: possible memory issues
	// function getConversations (callback) {
	// 	callback = !_.isFunction(callback) ? noop : callback;
    //
	// 	var prefix = Exporter.config('prefix');
	// 	var startms = +new Date();
    //
	// 	var query = 'SELECT '
	// 			+ prefix + 'PRIVATE_MESSAGE_USERS.TOPIC_ID as _cvid, '
	// 			+ prefix + 'PRIVATE_MESSAGE_USERS.USER_ID as _uid1, '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.USER_ID as _uid2 '
	// 			+ 'FROM ' + prefix + 'PRIVATE_MESSAGE_USERS '
	// 			+ 'JOIN ' + prefix + 'PRIVATE_MESSAGE_POSTS '
	// 			+ 'ON ' + prefix + 'PRIVATE_MESSAGE_POSTS.TOPIC_ID = ' + prefix + 'PRIVATE_MESSAGE_USERS.TOPIC_ID '
	// 			+ 'AND ' + prefix + 'PRIVATE_MESSAGE_POSTS.USER_ID != ' + prefix + 'PRIVATE_MESSAGE_USERS.USER_ID '
    //
	// 	var parse = function(v) { return parseInt(v, 10); };
    //
	// 	Exporter.connection.query(query,
	// 			function(err, rows) {
	// 				if (err) {
	// 					Exporter.error(err);
	// 					return callback(err);
	// 				}
    //
	// 				//normalize here
	// 				var map = {};
	// 				rows.forEach(function(row) {
	// 					if (!row._uid1 || !row._uid2) {
	// 						return;
	// 					}
	// 					row._uids = {};
	// 					row._uids[row._uid1] = row._uid2;
	// 					row._uids[row._uid2] = row._uid1
    //
	// 					map[row._cvid] = row;
	// 				});
    //
	// 				callback(null, map);
	// 			});
    //
	// }
    //
	// Exporter.getMessages = function(callback) {
	// 	return Exporter.getPaginatedMessages(0, -1, callback);
	// };
	// Exporter.getPaginatedMessages = function(start, limit, callback) {
	// 	callback = !_.isFunction(callback) ? noop : callback;
    //
	// 	if (!Exporter.connection) {
	// 		Exporter.setup(Exporter.config());
	// 	}
    //
	// 	var prefix = Exporter.config('prefix');
	// 	var startms = +new Date();
    //
	// 	var query = 'SELECT '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.POST_ID as _mid, '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.POST_BODY as _content, '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.USER_ID as _fromuid, '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.TOPIC_ID as _cvid, '
	// 			+ prefix + 'PRIVATE_MESSAGE_POSTS.POST_TIME as _timestamp '
    //
	// 			+ 'FROM ' + prefix + 'PRIVATE_MESSAGE_POSTS '
	// 			+ (start >= 0 && limit >= 0 ? 'LIMIT ' + start + ',' + limit : '');
    //
	// 	getConversations(function(err, conversations) {
	// 		if (err) {
	// 			return callback(err);
	// 		}
    //
	// 		Exporter.connection.query(query,
	// 				function(err, rows) {
	// 					if (err) {
	// 						Exporter.error(err);
	// 						return callback(err);
	// 					}
    //
	// 					//normalize here
	// 					var map = {};
	// 					rows.forEach(function(row) {
    //
	// 						var conversation = conversations[row._cvid];
	// 						if (!conversation) {
	// 							return;
	// 						}
    //
	// 						row._touid = conversation._uids[row._fromuid];
	// 						if (!row._touid) {
	// 							return;
	// 						}
    //
	// 						row._content = row._content || '';
	// 						row._timestamp = ((row._timestamp || 0) * 1000) || startms;
    //
	// 						delete row._cvid;
    //
	// 						map[row._mid] = row;
	// 					});
    //
	// 					callback(null, map);
	// 				});
	// 	});
	// };

	Exporter.teardown = function(callback) {
		Exporter.log('teardown');
		Exporter.connection.end();

		Exporter.log('Done');
		callback();
	};

	Exporter.testrun = function(config, callback) {
		async.series([
			function(next) {
				Exporter.setup(config, next);
			},
			function(next) {
				Exporter.getUsers(next);
			},
			function(next) {
				next();//Exporter.getGroups(next);
			},
			function(next) {
              Exporter.getCategories(next);
			},
			function(next) {
               Exporter.getTopics(next);
			},
			function(next) {
               Exporter.getPosts(next);
			},
			function(next) {
                next();//Exporter.getMessages(next);
			},
			function(next) {
				Exporter.teardown(next);
			}
		], callback);
	};

	Exporter.paginatedTestrun = function(config, callback) {
		async.series([
			function(next) {
				Exporter.setup(config, next);
			},
			function(next) {
				Exporter.getPaginatedUsers(0, 1000, next);
			},
			function(next) {
				Exporter.getPaginatedCategories(0, 1000, next);
			},
			function(next) {
				Exporter.getPaginatedTopics(0, 1000, next);
			},
			function(next) {
				Exporter.getPaginatedPosts(1001, 2000, next);
			},
			function(next) {
				Exporter.teardown(next);
			}
		], callback);
	};

	Exporter.warn = function() {
		var args = _.toArray(arguments);
		args.unshift(logPrefix);
		console.warn.apply(console, args);
	};

	Exporter.log = function() {
		var args = _.toArray(arguments);
		args.unshift(logPrefix);
		console.log.apply(console, args);
	};

	Exporter.error = function() {
		var args = _.toArray(arguments);
		args.unshift(logPrefix);
		console.error.apply(console, args);
	};

	Exporter.config = function(config, val) {
		if (config != null) {
			if (typeof config === 'object') {
				Exporter._config = config;
			} else if (typeof config === 'string') {
				if (val != null) {
					Exporter._config = Exporter._config || {};
					Exporter._config[config] = val;
				}
				return Exporter._config[config];
			}
		}
		return Exporter._config;
	};

	// from Angular https://github.com/angular/angular.js/blob/master/src/ng/directive/input.js#L11
	Exporter.validateUrl = function(url) {
		var pattern = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
		return url && url.length < 2083 && url.match(pattern) ? url : '';
	};

	Exporter.truncateStr = function(str, len) {
		if (typeof str != 'string') return str;
		len = _.isNumber(len) && len > 3 ? len : 20;
		return str.length <= len ? str : str.substr(0, len - 3) + '...';
	};

	Exporter.whichIsFalsy = function(arr) {
		for (var i = 0; i < arr.length; i++) {
			if (!arr[i])
				return i;
		}
		return null;
	};

})(module.exports);
