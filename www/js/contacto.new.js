var Contacto = function(){};

Contacto.prototype.createTable = function(sql){
	var query = "create table if not exists contacto( " + 
	"	id integer PRIMARY KEY AUTOINCREMENT, " + 
	"	idusuario text NOT NULL UNIQUE, " + 
	"	nombre varchar(160), " + 
	"	apellido varchar(160), " + 
	"	foto text, " + 
	"	grupo integer " + 
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
		this.grupo = data.grupo;
		var query = "INSERT OR REPLACE INTO contacto(idusuario,nombre,apellido,foto,grupo) VALUES(?,?,?,?,?)";
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
	//var query = "SELECT c.*,(select count(1) from notificacion n where c.grupo=0 and n.remitente=c.idusuario and n.leido=0) as mensajes,(select max(fecha) from notificacion n where (c.grupo=0 and (n.remitente=c.idusuario or n.receptor=c.idusuario)) or (c.grupo=1 and n.receptor=c.idusuario)) as ultimafecha,(select n.mensaje from notificacion n where (c.grupo=0 and (n.receptor=c.idusuario or remitente=c.idusuario)) or (c.grupo=1 and n.receptor=c.idusuario) order by id desc limit 1) as ultimomensaje FROM contacto c";
	var query = "SELECT * FROM contacto c"
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
