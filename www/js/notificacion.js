var Notificacion = function(){};

Notificacion.prototype.createTable = function(sql){
	var query = "create table if not exists notificacion( " + 
	"	id integer PRIMARY KEY AUTOINCREMENT, " + 
	"	message_id varchar(160), " + 
	"	remitente integer, " + 
	"	receptor integer, " + 
	"	mensaje text, " + 
	"	fecha DATETIME, " + 
	"	enviado integer default 0, " + 
	"	leido integer default 0 " + 
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
		this.remitente = data.remitente;
		this.receptor = data.receptor;
		this.mensaje = data.mensaje;
		this.fecha = data.fecha;
		this.enviado = data.enviado;
		this.leido = data.leido;
		var query = "INSERT OR REPLACE INTO notificacion(id,remitente,receptor,mensaje,fecha,enviado,leido) VALUES(?,?,?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.id, self.remitente, self.receptor, self.mensaje, self.fecha, self.enviado, self.leido],
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
Notificacion.prototype.readMessages = function(sql,rem,rec){
	var query = "UPDATE notificacion SET leido='1' WHERE receptor='"+rec+"' AND remitente='"+rem+"' and leido='0'";
	sql.transaction(
		function(tx){
			tx.executeSql(query);
		}
	);
}
Notificacion.prototype.select = function(sql,user,callback){
	var query = "SELECT * FROM notificacion";
	if( typeof user !== 'undefined' || user != null ){
		query+=" WHERE receptor='"+user+"' OR remitente='"+user+"'";
	}
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
