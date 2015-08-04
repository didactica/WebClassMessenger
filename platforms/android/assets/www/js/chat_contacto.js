var ChatContacto = function(){};

ChatContacto.prototype.createTable = function(sql){
	var query = "create table chat_contacto(" + 
	"	id integer primary key not null autoincrement," + 
	"	chat integer not null," + 
	"	contacto integer not null," + 
	"	silenciado integer default 0," + 
	"	nombre varchar(128)," + 
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
ChatContacto.prototype.insert = function(sql,data,callback){
	if( typeof data !=='object' ){
		console.log("ERROR: Debe proveer un conjunto de datos valido");
	} else {
		this.id = data.id;
		this.chat = data.chat;
		this.contacto = data.contacto;
		this.silenciado = data.silenciado;
		this.nombre = data.nombre;
		this.secuencia = data.secuencia;
		var query = "INSERT OR REPLACE INTO chat_contacto(id, chat, contacto, silenciado, nombre, secuencia) VALUES(?,?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.id, self.chat, self.contacto, self.silenciado, self.nombre, self.secuencia],
					function(tx,result){
						if(callback){
							callback();
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
/*
ChatContacto.prototype.select = function(sql,chat,callback){
	if( grupo==null ){
		grupo=false;
	}
	var query = "SELECT * FROM chat_contacto WHERE chat='"+chat+"'";
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
					var chat_contactos = [];
					for( var i=0; i<result.rows.length; i++ ){
						var curObj = result.rows.item(i);
						chat_contactos.push(curObj);
					}
					if(callback){
						callback(chat_contactos);
					}
				},
				function(tx,error){
				}
			);
		}
	);
}
//*/
