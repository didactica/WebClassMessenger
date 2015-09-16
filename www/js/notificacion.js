var Notificacion = function(){};

Notificacion.prototype.createTable = function(sql){
	var query = " create table if not exists mensaje_chat(" + 
	"	id integer primary key AUTOINCREMENT," + 
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
		// WE NEED TO KNOW IF THE MESSAGE ALREADY EXISTS SO WE DONT OVERRIDE ITS "READ" PROPERTY, WHICH HAS TO BE HANDLED LOCALLY AND NOT FROM THE SERVER.
		sql.transaction(
			function(tx){
				tx.executeSql(
					"select * from mensaje_chat where id=?",
					[self.id],
					function(tx,result){
						if(result.rows.length>0){
							var tmpobj = result.rows.item(0);
							self.leido = tmpobj.leido;
						}
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
Notificacion.prototype.readMessages = function(sql,chat,push){
	var user = window.localStorage.getItem("user");
	var query = "UPDATE mensaje_chat SET leido='1' WHERE chat='"+chat+"'";
	if( push ){
		query += " AND remitente='"+user+"' and leido='0'";
	} else {
		query += " AND remitente!='"+user+"' and leido='0'";
	}
	sql.transaction(
		function(tx){
			tx.executeSql(query);
		}
	);
}
Notificacion.prototype.select = function(sql,chat,startPoint,callback){
	var query = "select * from (select *,cct.nombre as titulo,mjc.id as orden from mensaje_chat mjc left join chat_contacto cct on mjc.chat=cct.chat and mjc.remitente=cct.contacto WHERE mjc.chat='"+chat+"' group by orden order by orden desc ";
	console.log(query);
	if( typeof startPoint === 'function' ){
		callback = startPoint;
		query+=' limit 0,20';
	} else {
		query += ' limit '+startPoint+', 20';
	}
	query += ") tbl order by orden asc";
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
