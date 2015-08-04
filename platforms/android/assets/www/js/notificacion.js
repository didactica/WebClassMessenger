var Notificacion = function(){};

Notificacion.prototype.createTable = function(sql){
	var query = " create table mensaje_chat(" + 
	"	id bigint primary key not null autoincrement," + 
	"	message_id varchar(160)," + 
	"	remitente int(10) references usuario(id) on delete cascade," + 
	"	mensaje text," + 
	"	fecha timestamp default CURRENT_TIMESTAMP," + 
	"	enviado int default 0," + 
	"	leido int default 0," + 
	"	chat integer not null," + 
	"	secuencia integer default 0" + 
	" )";
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
Notificacion.prototype.insert = function(sql,data,callback){
	if( typeof data !=='object' ){
		console.log("ERROR: Debe proveer un conjunto de datos valido");
	} else {
		this.id = data.id;
		this.message_id = data.message_id;
		this.remitente = data.remitente;
		this.mensaje = data.mensaje;
		this.fecha = data.fecha;
		this.enviado = data.enviado;
		this.leido = data.leido;
		this.chat = data.chat;
		this.secuencia = data.secuencia;
		var query = "INSERT OR REPLACE INTO mensaje_chat(id,message_id,remitente,mensaje,fecha,enviado,leido,chat,secuencia) VALUES(?,?,?,?,?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.id, self.message_id, self.remitente, self.mensaje, self.fecha, self.enviado, self.leido, self.chat, self.secuencia],
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
Notificacion.prototype.readMessages = function(sql,remitente,chat){
	var query = "UPDATE mensaje_chat SET leido='1' WHERE chat='"+chat+"' AND remitente='"+remitente+"' and leido='0'";
	sql.transaction(
		function(tx){
			tx.executeSql(query);
		}
	);
}
Notificacion.prototype.select = function(sql,chat,callback){
	if( grupo==null ){
		grupo=false;
	}
	var query = "SELECT * FROM mensaje_chat WHERE chat='"+chat+"'";
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
					var mensajes = [];
					for( var i=0; i<result.rows.length; i++ ){
						var curObj = result.rows.item(i);
						mensajes.push(curObj);
					}
					if(callback){
						callback(mensajes);
					}
				},
				function(tx,error){
				}
			);
		}
	);
}
