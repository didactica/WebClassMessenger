var Contacto = function(){};

Contacto.prototype.createTable = function(sql){
	var query = "create table if not exists contacto( " + 
	"	id integer PRIMARY KEY AUTOINCREMENT, " + 
	"	idusuario text NOT NULL UNIQUE, " + 
	"	nombre varchar(160), " + 
	"	apellido varchar(160), " + 
	"	foto text, " + 
	"	tipo varchar(128), " + 
	"	secuencia integer " + 
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
Contacto.prototype.insert = function(sql,data,callback){
	if( typeof data !=='object' ){
		console.log("ERROR: Debe proveer un conjunto de datos valido");
	} else {
		this.idusuario = data.idusuario;
		this.nombre = data.nombre;
		this.apellido = data.apellido;
		this.foto = data.foto;
		this.tipo = data.tipo;
		this.secuencia = data.secuencia;
		var query = "INSERT OR REPLACE INTO contacto(idusuario,nombre,apellido,foto,tipo,secuencia) VALUES(?,?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.idusuario, self.nombre, self.apellido, self.foto, self.tipo, self.grupo],
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
Contacto.prototype.select = function(sql,filter,callback){
	var user = window.localStorage.getItem("user");
	var query = "SELECT c.* FROM contacto c";
	if( filter!=null ){
		query += filter+" and idusuario!='"+user+"'";
	} else {
		query += " WHERE idusuario!='"+user+"'";
	}
	sql.transaction(
		function(tx){
			tx.executeSql(
				query,
				[],
				function(tx,result){
					var contactos = [];
					for( var i=0; i<result.rows.length; i++ ){
						var curObj = result.rows.item(i);
						if(curObj.mensajes==0){
							delete curObj.mensajes;
						}
						if(typeof curObj.ultimomensaje!=='string'){
							curObj.ultimomensaje = '';
						}
						var foto = new Image();
						foto.src = curObj.foto;
						contactos.push(curObj);
					}
					if(callback){
						callback(contactos);
					}
				},
				function(tx,error){
				}
			);
		}
	);
}
