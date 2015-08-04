var Contacto = function(){};

Contacto.prototype.createTable = function(sql){
	var query = "create table if not exists contacto( " + 
	"	id integer PRIMARY KEY AUTOINCREMENT, " + 
	"	idusuario text NOT NULL UNIQUE, " + 
	"	nombre varchar(160), " + 
	"	apellido varchar(160), " + 
	"	foto text, " + 
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
		this.secuencia = data.secuencia;
		var query = "INSERT OR REPLACE INTO contacto(idusuario,nombre,apellido,foto,secuencia) VALUES(?,?,?,?,?)";
		var self = this;
		sql.transaction(
			function(tx){
				tx.executeSql(
					query,
					[self.idusuario, self.nombre, self.apellido, self.foto, self.grupo],
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
	var query = "SELECT c.* FROM contacto c";
	if( filter!=null ){
		query += filter;
	}
	console.log(query);
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
