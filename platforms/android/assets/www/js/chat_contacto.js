var url = "http://proyecto.webescuela.cl/sistema/testing";

var ChatContacto = function(){};

ChatContacto.prototype.createTable = function(sql){
	var query = "create table if not exists chat_contacto(" + 
	"	id integer primary key AUTOINCREMENT," + 
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
//*
ChatContacto.prototype.select = function(sql,contacto,callback){
	var user = window.localStorage.getItem("user");
	var query = "select * from chat where id in (select chat from chat_contacto where contacto='"+contacto+"') and grupo=0;";
	// var query = "SELECT *,ct.id as contactoId, c.id as chatId FROM contacto ct LEFT JOIN chat_contacto cct ON cct.contacto=ct.idusuario LEFT JOIN chat c ON c.id=cct.chat and c.grupo=0 WHERE ct.idusuario='"+contacto+"'";
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
					var retval = 0;
					if( result.rows!=null && result.rows.length>0 ){
						var curObj = result.rows.item(0);
						retval = curObj.id;
						if(callback){
							callback(retval);
						}
					} else {
						var q = "select * from contacto where idusuario='"+contacto+"'";
						tx.executeSql(
							q,
							[],
							function(tx,result){
								if( result.rows.length>0 ){	
									var tmp = result.rows.item(0);
									var data = {
										nombre:tmp.nombre+" "+tmp.apellido,
										foto:tmp.foto,
										grupo:"0"
									} 
									var postParams = data;
									postParams.usuarios = [contacto,user];
									$.ajax({
										url:url+"/gcm/new-chat.php",
										data:postParams,
										dataType:'json',
										type:'POST',
										success:function(resp){
											if( typeof resp.id !== 'undefined' ){
												var c = new Chat();
												data.id = resp.id;
												c.insert(sql,data,function(res){
													retval = res.insertId;
													if(callback){
														callback(retval);
													}
												});
												for( var id in resp.chat_contacto ){
													var curCC = resp.chat_contacto[id];
													var cc = new ChatContacto();
													cc.insert(sql,curCC,function(){
														console.log("inserted chat_contacto");
													});
												}
											}
										},
										error:function(resp,error){
											console.log(JSON.stringify(resp));
											console.log(error);
											navigator.notification.alert("No se pudo iniciar el nuevo chat. Por favor conectese a Internet e intentelo nuevamente",null,"Error");
										}
									});
								}
							},
							function(tx,error){
								console.log("ATENCION!!!");
								console.log(JSON.stringify(error));
							}
						);
					}
				},
				function(tx,error){
				}
			);
		}
	);
}
//*/
ChatContacto.prototype.silenciar = function(sql,chat,callback){
	var user = window.localStorage.getItem("user");
	sql.transaction(
		function(tx){
			var query = "update chat_contacto set silenciado=1 where chat='"+chat+"' and contacto='"+user+"'";
			tx.executeSql(
				query,
				[],
				function(tx,result){
					if(result.rowsAffected>0){
						if(callback){
							callback(true);
						}
					}
				}
			);
		}
	);
}
