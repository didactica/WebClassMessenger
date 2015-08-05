var Chat = function(){};

Chat.prototype.createTable = function(sql){
	var query = "create table if not exists chat(" + 
	"	id integer primary key AUTOINCREMENT," + 
	"	nombre varchar(128) not null," + 
	"	foto text," + 
	"	grupo integer default 0," + 
	"	secuencia integer default 0" + 
	")";
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
				},
				function(tx,error){
					console.log("ATENCION!!!");
					console.log(JSON.stringify(error));
				}
			);
		}
	);
}
Chat.prototype.insert = function(sql,data,callback){
	if( typeof data !=='object' ){
		console.log("ERROR: Debe proveer un conjunto de datos valido");
	} else {
		var self = this;
		this.nombre = data.nombre;
		this.foto = data.foto;
		this.grupo = data.grupo;
		this.secuencia = data.secuencia||0;
		if( typeof data.id !== 'undefined' ){
			this.id = data.id;
			var query = "INSERT OR REPLACE INTO chat(id,nombre,foto,grupo,secuencia) VALUES(?,?,?,?,?)";
			var insertArray = [self.id, self.nombre, self.foto, self.grupo, self.secuencia];
		} else {
			var query = "INSERT OR REPLACE INTO chat(nombre,foto,grupo,secuencia) VALUES(?,?,?,?)";
			var insertArray = [self.nombre, self.foto, self.grupo, self.secuencia];
		}
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					insertArray,
					function(tx,result){
						if(callback){
							callback(result);
						}
					},
					function(tx,error){
						console.log("ATENCION!!!!");
						console.log(JSON.stringify(error));
					}
				);
			}
		);
	}
}
Chat.prototype.select = function(sql,filter,grupo,callback){
	var user = window.localStorage.getItem("user");
	if(filter==null){
		filter = " WHERE 1=1";
	}
	if( grupo ){
		var query = "SELECT *,nombre as display_name,foto as display_image,(select fecha from mensaje_chat mjc where mjc.chat=chat.id order by id desc limit 1) as ultimafecha,(select mensaje from mensaje_chat mjc where mjc.chat=chat.id order by id desc limit 1) as ultimomensaje,(select count(1) from mensaje_chat mjc where mjc.remitente!='"+user+"' and mjc.chat=chat.id and mjc.leido=0) as mensajes FROM chat "+filter+" and grupo=1";
	} else {
		var query = "SELECT c.*,cct.nombre as display_name,ct.foto as display_image,(select fecha from mensaje_chat mjc where mjc.chat=c.id order by id desc limit 1) as ultimafecha,(select mensaje from mensaje_chat mjc where mjc.chat=c.id order by id desc limit 1) as ultimomensaje,(select count(1) from mensaje_chat mjc where mjc.remitente!='"+user+"' and mjc.chat=c.id and mjc.leido=0) as mensajes FROM chat c LEFT JOIN chat_contacto cct ON cct.chat=c.id and cct.contacto!='"+user+"' LEFT JOIN contacto ct ON cct.contacto=ct.idusuario "+filter+" and c.grupo=0";
	}
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
					var chats = [];
					for( var i=0; i<result.rows.length; i++ ){
						var curObj = result.rows.item(i);
						chats.push(curObj);
					}
					if(callback){
						callback(chats);
					}
				},
				function(tx,error){
					console.log("ATENCION!!!");
					console.log(JSON.stringify(error));
				}
			);
		}
	);
}
