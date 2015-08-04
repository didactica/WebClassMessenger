var Chat = function(){};

Chat.prototype.createTable = function(sql){
	var query = "create table chat(" + 
	"	id integer primary key not null autoincrement," + 
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
		this.id = data.id;
		this.nombre = data.nombre;
		this.foto = data.foto;
		this.grupo = data.grupo;
		this.secuencia = data.secuencia;
		var query = "INSERT OR REPLACE INTO chat(id,nombre,foto,grupo,secuencia) VALUES(?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.id, self.nombre, self.foto, self.grupo, self.secuencia],
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
Chat.prototype.select = function(sql,chat,callback){
	if( grupo==null ){
		grupo=false;
	}
	var query = "SELECT * FROM chat WHERE id='"+chat+"'";
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
				}
			);
		}
	);
}
