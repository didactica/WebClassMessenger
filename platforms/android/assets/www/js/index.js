
// variables referenciales
var url = "http://proyecto.webescuela.cl/sistema/testing";
var user;
var chat;
var sql;
var secuencia;
var notificacion = new Notificacion();
var buscar = false;
var filtroUsuario = null;
var alltabs = ['grupos','chats','usuarios'];
var tab = "chats";
var silenciado = false;
var bannerUsuarioHeight = {};
var limitOffset = 0;
var push;

$("#tabs-usuarios li, #tabs-usuarios a").off("click");
$("#tabs-usuarios li, #tabs-usuarios a").on("click",function(e){
	e.preventDefault();
	$("#tabs-usuarios li").removeClass("active");
	$(this).addClass("active");
});

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
		document.addEventListener("backbutton",backButton, false);
        document.addEventListener("deviceready", this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
		document.addEventListener("resume", app.resumeApp, false);
		user = window.localStorage.getItem("user");
		if( user==null ){
			// CREACION DE TABLAS
			sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
			var o = new Contacto();
			o.createTable(sql);
			var o = new Chat();
			o.createTable(sql);
			var o = new ChatContacto();
			o.createTable(sql);
			var o = new Notificacion();
			o.createTable(sql);
			$("#main-content").hide();
			$(".hide-login").hide();
			$("#login-container").show();
			$("#login-form").on("submit",function(e){
				e.preventDefault();
				var userLogin = $("input[name=usuario]").val();
				var passLogin = $("input[name=password]").val();
				if( userLogin.length==0 || passLogin.length==0 ){
					navigator.notification.alert("Debe ingresar su usuario y clave",function(){ $("input[name=usuario]").focus(); },"Error");
				} else {
					navigator.notification.activityStart("Identificando","Comprobando datos...");
					$.ajax({
						url:url+"/gcm/login.php",
						data:{user:userLogin, pass:passLogin, nocolegios:true},
						dataType: 'json',
						type:'POST',
						success: function(resp){
							navigator.notification.activityStop();
							if(resp.state==0){
								user = resp.user;
								window.localStorage.setItem("user",user);
								secuencia = 0;
								window.localStorage.setItem("secuencia",secuencia);
								app.initializeUser();
							} else {
								navigator.notification.alert("Error: \n"+resp.message,function(){ $("input[name=passrowd]").val(""); $("input[name=usuario]").focus() },"Login");
							}
						},
						error: function(resp){
							navigator.notification.activityStop();
							navigator.notification.alert("No se puede procesar su solicitud en estos momentos, por favor intentelo nuevamente más adelante.",function(){},"Error");
							console.log(JSON.stringify(resp));
						}
					});
				}
			});
		} else {
			app.initializeUser();
		}
    },
	initializeUser: function(){
		// BDD
		sql = window.openDatabase("WebClassMobile", "1.0", "WebClass Educational Suite Mobile", 1024*1024*10);
		// BUILD MENU
		app.inflateMenu();
		secuencia = window.localStorage.getItem("secuencia")
		$("#login-container").hide();
		$(".hide-login").show();
		$("#main-content").show();
		var contacto = new Contacto();
		contacto.createTable(sql);
		notificacion.createTable(sql);
		app.downloadMessages();
		app.setTitle();
		app.receivedEvent('deviceready');
		if( chat==null ){
			app.getNewMessages();
			$("#lista-usuarios").html("");
			$("#tabs-usuarios ul li").removeClass("active");
			switch(tab){
				case 'usuarios':
					navigator.notification.activityStart("Cargando", "Cargando lista de usuarios");
					$("#tabs-usuarios ul li a[href='#usuarios']").parents('li').addClass("active");
					break;
				case 'grupos':
					navigator.notification.activityStart("Cargando", "Cargando grupos");
					$("#tabs-usuarios ul li a[href='#grupos']").parents('li').addClass("active");
					break;
				case 'chats':
					navigator.notification.activityStart("Cargando", "Cargando chats");
					$("#tabs-usuarios ul li a[href='#chats']").parents('li').addClass("active");
					break;
			}
			filtroUsuario = null;
			$("#tabs-usuarios ul li").off("click");
			$("#tabs-usuarios ul li").on("click",function(e){
				e.preventDefault();
				var action = ($($(this).find('a')).attr("href")).substr(1);
				tab = action;
				app.initializeUser();
			});
			$("#usuarios").show();
			$("#chat").hide();
			$("#buscar-usuario").show();
			$("#buscar-usuario").off("click");
			$("#buscar-usuario").on("click",function(){
				buscar = true;
				$("#tabs-usuarios").hide();
				$(".heading").hide();
				$("#search-group").show();
				$("#lista-usuarios").css({marginTop:'0px'});
				$("#search-query").focus();
				$("#search-query").on("keyup",function(e){
					if( e.keyCode==13 ){
						var query = $(this).val();
						filtroUsuario = null;
						if(query.length>0){
							switch(tab){
								case 'chats':
									navigator.notification.activityStart("Buscando", "Buscando chat");
									filtroUsuario = " where lower(c.nombre) like '%"+query+"%'";
									break;
								case 'usuarios':
									navigator.notification.activityStart("Buscando", "Buscando contacto");
									filtroUsuario = " where lower(nombre) like '%"+query+"%' or lower(apellido) like '%"+query+"%'";
									break;
								case 'grupos':
									navigator.notification.activityStart("Buscando", "Buscando grupo");
									filtroUsuario = " where lower(chat.nombre) like '%"+query+"%'";
									break;
							}
						}
						app.populateUsers();
					}
				});
			});
			app.populateUsers();
		} else {
			navigator.notification.activityStart("Cargando", "Cargando mensajes");
			$("#usuarios").hide();
			$("#chat").show();
			$("#buscar-usuario").hide();
			app.populateMessages();
			$("#inp-message").on("focus",function(){
				$("*").scrollTop($("#messages").height());
				app.readMessages();
			});
			$("#btn-enviar").off("click");
			$("#btn-enviar").on("click",function(e){
				var message = $("#inp-message").val();
				if( message.length>0 || message!='' ){
					navigator.notification.activityStart("Enviando","Enviando mensaje...");
					var dt = new Date();
					var fecha = dt.getFullYear()+"-"+((dt.getMonth()+1)<10?'0'+(dt.getMonth()+1):(dt.getMonth()+1))+'-'+(dt.getDate()<10?'0'+dt.getDate():dt.getDate())+' '+(dt.getHours()<10?'0'+dt.getHours():dt.getHours())+':'+(dt.getMinutes()<10?'0'+dt.getMinutes():dt.getMinutes())+':'+(dt.getSeconds()<10?'0'+dt.getSeconds():dt.getSeconds());
					var postData = {
						remitente:user,
						chat:chat,
						message:message,
						fecha:fecha
					};
					$.ajax({
						url:url+"/gcm/send.php?push=true",
						data:postData,
						type:'POST',
						dataType:'json',
						success:function(resp){
							navigator.notification.activityStop();
							$("#inp-message").val("");
							resp.data.class = "fa fa-ellipsis-h";
							app.addMessage(resp.data);
						},
						error: function(resp,error){
							console.log(JSON.stringify(resp));
							console.log(error);
							navigator.notification.activityStop();
							navigator.notification.alert("No se pudo enviar el mensaje",function(){ $("#inp-message").focus(); },"Error");
						}
					});
				}
			});
		}
	},
    // Update DOM on a Received Event
    receivedEvent: function(id) {
		// PUSH
		/*
		var pushNotification = window.plugins.pushNotification;
		pushNotification.register(app.successHandler, app.errorHandler,{"senderID":"729453770855","ecb":"app.onNotificationGCM","alert":"true","sound":"true","badge":"true"});
		//*/
		// LAST REVISION POR PUSH PLUGIN
		push = PushNotification.init({ "android": {"senderID": "729453770855"},"ios": {}, "windows": {} } );
		push.on('registration', app.pushRegistration);
		push.on('notification', app.pushMessage);
		push.on('error', function(e) {
			console.log("Error de PushPlugin"+e.message)
		});
    },
	pushRegistration: function(data) {
		// data.registrationId
		if ( data.registrationId.length > 0 )
		{
			var data = {
				user : user, // FIXME: mandar la id del usuario actual
				id: data.registrationId
			}
			$.ajax({
				url : url+'/gcm/saveDeviceId.php',
				data : data,
				type: 'POST',
				success : function(resp){
					//console.log(resp);
				}, 
				error : function(resp,error){
					console.log(JSON.stringify(resp));
				}
			});
		}
	},
	pushMessage: function(data) {
		if( data.additionalData.read=='true' || data.additionalData.read ){
			if( data.additionalData.chat==chat ){
				$(".fa.fa-ellipsis-h").removeClass("fa-ellipsis-h").addClass("fa-check");
			}
			var n = new Notificacion();
			n.readMessages(sql,data.additionalData.chat,true);
		} else {
			var params = {
				user : user,
				secuencia : secuencia,
				leer:true
			};
			$.ajax({
				url : url+'/gcm/getMessages.php',
				data : params,
				type : 'POST',
				dataType : 'json',
				success : function(result){
					if(result.status==0){
						for( var id in result.messages ){
							var mes = result.messages[id];
							if( parseInt(mes.secuencia)>parseInt(secuencia) ){
								secuencia = mes.secuencia;
							}
							var n = new Notificacion();
							n.insert(sql,mes,function(){
							});
						}
						window.localStorage.setItem("secuencia",secuencia);
					}
				},
				error : function(resp){
				},
			}).done(function(r){
				//*
				if( data.additionalData.foreground ){
					if(chat!=null){
						app.populateMessages();
					} else {
						app.populateUsers();
					}
				} else {
					if( data.additionalData.coldstart ){
						chat = data.additionalData.chat;
						app.initializeUser();
					} else {
						if(chat!=null){
							limitOffset = 0;
							app.populateMessages();
						} else {
							app.populateUsers();
						}
					}
				}
				//*/
			});
		}
	},
	successHandler: function(result){
	},
	errorHandler: function(error){
		alert(error);
	},
	/*
	onNotificationGCM: function(e) {
		switch( e.event )
		{
		case 'registered':
			if ( e.regid.length > 0 )
			{
				var data = {
					user : user, // FIXME: mandar la id del usuario actual
					id: e.regid
				}
				$.ajax({
					url : url+'/gcm/saveDeviceId.php',
					data : data,
					type: 'POST',
					success : function(resp){
						//console.log(resp);
					}, 
					error : function(resp,error){
						console.log(JSON.stringify(resp));
					}
				});
			}
			break;
		case 'message':
			if( e.payload.read=='true' || e.payload.read ){
				if( e.payload.chat==chat ){
					$(".fa.fa-ellipsis-h").removeClass("fa-ellipsis-h").addClass("fa-check");
				}
				var n = new Notificacion();
				n.readMessages(sql,e.payload.chat,true);
			} else {
				var params = {
					user : user,
					secuencia : secuencia,
					leer:true
				};
				$.ajax({
					url : url+'/gcm/getMessages.php',
					data : params,
					type : 'POST',
					dataType : 'json',
					success : function(result){
						if(result.status==0){
							for( var id in result.messages ){
								var mes = result.messages[id];
								if( parseInt(mes.secuencia)>parseInt(secuencia) ){
									secuencia = mes.secuencia;
								}
								var n = new Notificacion();
								n.insert(sql,mes,function(){
								});
							}
							window.localStorage.setItem("secuencia",secuencia);
						}
						if( e.foreground ){
							if(chat!=null){
								app.populateMessages();
							} else {
								app.populateUsers();
							}
						} else {
							if( e.coldstart ){
								chat = e.payload.chat;
								app.initializeUser();
							} else {
								if(chat!=null){
									limitOffset = 0;
									app.populateMessages();
								} else {
									app.populateUsers();
								}
							}
						}
					},
					error : function(resp){
					},
				});
			}
			break;
		case 'error':
			alert('GCM error = '+e.msg);
			break;
		default:
			alert('An unknown GCM event has occurred');
			break;
		}
	},
	//*/
	addMessage: function(data){
		if( data.user!=user ){
			var source = $("#incoming-chat").html();
		} else {
			var source = $("#outgoing-chat").html();
		}
		var t = (data.time).split(/[- :]/);
		data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		//*
		if( (data.message).indexOf("data:image/jpg;base64,") > -1 ){
			data.message = (data.message).replace(/\\"/g,'"');
			data.message = (data.message).replace(/\\'/g,"'");
		}
		if( (data.message).indexOf("onclick") > -1 ){
			data.message = (data.message).replace(/\\"/g,'"');
			data.message = (data.message).replace(/\\'/g,"'");
		}
		//*/
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#chat-window").append(result);
		$("*").scrollTop($("#messages").height());
	},
	addChat: function(data){
		if(typeof data.ultimafecha==='string'){
			var t = (data.ultimafecha).split(/[- :]/);
			data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		} else {
			data.time = 'Nunca';
		}
		var mensaje = data.ultimomensaje;
		if( mensaje == null ){
			mensaje = "";
		}
		console.log(mensaje);
		if( (mensaje).indexOf("<img") > -1 ){
			data.mensaje = "<span style='font-family:FontAwesome;'>&#xf030;</span> Imagen";
		}else if( (mensaje).indexOf("fa fa-download") > -1 ){
			data.mensaje = "<span style='font-family:FontAwesome;'>&#xf15b;</span> Archivo";
		} else {
			if( typeof mensaje!== 'undefined' && mensaje!=null ){
				if( typeof data.lastusuario === 'undefined' || data.lastusuario==null ){
				} else {
					mensaje = data.lastusuario+": "+mensaje;
				}
				if( (mensaje).length>25 ){
					data.mensaje = (mensaje).substr(0, 25) + "\u2026";
				} else {
					data.mensaje = mensaje;
				}
			} else {
				data.mensaje = '';
			}
		}
		var source = $("#chat-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#lista-usuarios").append(result);
	},
	addUser: function(data){
		var source = $("#usuario-div").html();
		var template = Handlebars.compile(source);
		var result = template(data);
		$("#lista-usuarios").append(result);
	},
	populateMessages: function(){
		if( typeof startPoint === 'undefined' ){
			var startPoint = 0;
		}
		if( buscar ){
			buscar = false;
			$("#tabs-usuarios").show();
			$(".heading").show();
			$("#search-group").hide();
			$("#lista-usuarios").css({marginTop:'3em'});
		}
		$("#search-query").val("");
		filtroUsuario = null;
		notificacion.select(sql,chat,limitOffset,function(mensajes){
			if( mensajes.length==20 ){
				$(".moar-messages").show();
				$(".moar-messages").off("click");
				$(".moar-messages").on("click",function(){
					limitOffset+=20;
					notificacion.select(sql,chat,limitOffset,function(mensajes){
						if(mensajes.length>0){
							var firstMessage = $("#chat-window li:first");
							for(var i=mensajes.length; i>0; i--){
								var mes = mensajes[i-1];
								var data = {
									id : mes.id,
									user : mes.remitente,
									time : mes.fecha,
									message : mes.mensaje,
									class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
								};
								if( typeof mes.titulo !== 'undefined' && tab=='grupos' ){
									data.color = textToColor(mes.titulo);
									data.titulo = mes.titulo;
								}
								if( data.user!=user ){
									var source = $("#incoming-chat").html();
								} else {
									var source = $("#outgoing-chat").html();
								}
								var t = (data.time).split(/[- :]/);
								data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
								var template = Handlebars.compile(source);
								var result = template(data);
								$("#chat-window").prepend(result);
							}
							$(document).scrollTop(firstMessage.offset().top-($(".moar-messages").height()+$(".heading").height()*3));
						}
						if( mensajes.length<20 ){
							$(".moar-messages").hide();
						}
					});
				});
			} else {
				$(".moar-messages").hide();
			}
			for( var id in mensajes ){
				var mes = mensajes[id];
				var data = {
					id : mes.id,
					user : mes.remitente,
					time : mes.fecha,
					message : mes.mensaje,
					class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
				};
				if( typeof mes.titulo !== 'undefined' && tab=='grupos' ){
					data.color = textToColor(mes.titulo);
					data.titulo = mes.titulo;
				}
				app.addMessage(data);
			}
			navigator.notification.activityStop();
		});
		app.downloadMessages(function(){
			app.readMessages();
			app.setTitle();
			notificacion.select(sql,chat,limitOffset,function(mensajes){
				$("ul#chat-window").html("");
				if( mensajes.length==20 ){
					$(".moar-messages").show();
					$(".moar-messages").off("click");
					$(".moar-messages").on("click",function(){
						limitOffset+=20;
						notificacion.select(sql,chat,limitOffset,function(mensajes){
							if(mensajes.length>0){
								var firstMessage = $("#chat-window li:first");
								for(var i=mensajes.length; i>0; i--){
									var mes = mensajes[i-1];
									var data = {
										id : mes.id,
										user : mes.remitente,
										time : mes.fecha,
										message : mes.mensaje,
										class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
									};
									if( typeof mes.titulo !== 'undefined' && tab=='grupos' ){
										data.color = textToColor(mes.titulo);
										data.titulo = mes.titulo;
									}
									if( data.user!=user ){
										var source = $("#incoming-chat").html();
									} else {
										var source = $("#outgoing-chat").html();
									}
									var t = (data.time).split(/[- :]/);
									data.time = timeSince(new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
									var template = Handlebars.compile(source);
									var result = template(data);
									$("#chat-window").prepend(result);
								}
								$(document).scrollTop(firstMessage.offset().top-($(".moar-messages").height()+$(".heading").height()*3));
							}
							if( mensajes.length<20 ){
								$(".moar-messages").hide();
							}
						});
					});
				} else {
					$(".moar-messages").hide();
				}
				for( var id in mensajes ){
					var mes = mensajes[id];
					var data = {
						id : mes.id,
						user : mes.remitente,
						time : mes.fecha,
						message : mes.mensaje,
						class : (mes.leido?'fa fa-check':'fa fa-ellipsis-h')
					};
					if( typeof mes.titulo !== 'undefined' && tab=='grupos' ){
						data.color = textToColor(mes.titulo);
						data.titulo = mes.titulo;
					}
					app.addMessage(data);
				}
			});
		});
	},
	getNewMessages: function(){
		sql.transaction(
			function(tx){
				var query = "select (select count(1) from chat c left join mensaje_chat mjc on mjc.chat=c.id and c.grupo=1 where mjc.leido=0 and mjc.remitente!='"+user+"') as grupo, (select count(1) from chat c left join mensaje_chat mjc on mjc.chat=c.id and c.grupo=0 where mjc.leido=0 and mjc.remitente!='"+user+"') as chat;";
				tx.executeSql(
					query,
					[],
					function(tx,result){
						if( result.rows!=null && result.rows.length>0 ){
							var res = result.rows.item(0);
							var newChat = res.chat;
							var newGrupo = res.grupo;
							if( !isNaN(newChat) ){
								if( parseInt(newChat)>0 ){
									$("#chat-new").html(newChat);
									$("#chat-new").show();
								} else {
									$("#chat-new").html("");
									$("#chat-new").hide();
								}
							}
							if( !isNaN(newGrupo) ){
								if( parseInt(newGrupo)>0 ){
									$("#grupo-new").html(newGrupo);
									$("#grupo-new").show();
								} else {
									$("#grupo-new").html("");
									$("#grupo-new").hide();
								}
							}
						}
					},
					function(tx,error){
						console.log(JSON.stringify(error));
					}
				);
			}
		);
	},
	populateUsers: function(){
		switch(tab){
			case 'grupos':
				var c = new Chat();
				c.select(sql,filtroUsuario,true,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addChat(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Grupos para mostrar</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						chat = $(this).attr("data-rel");
						limitOffset = 0;
						sql.transaction(
							function(tx){
								tx.executeSql(
									"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
									[user,chat],
									function(tx,result){
										if( result.rows!=null && result.rows.length>0 ){
											var tObj = result.rows.item(0);
											silenciado = tObj.silenciado==1;
										}
										app.initializeUser();
									},
									function(tx,error){
										app.initializeUser();
									}
								);
							}
						);
					});
				});
				break;
			case 'usuarios':
				var c = new Contacto();
				c.select(sql,filtroUsuario,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addUser(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Contactos en tu lista</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						var contacto = $(this).attr("data-rel");
						var cct = new ChatContacto();
						limitOffset = 0;
						cct.select(sql,contacto,function(resChat){
							chat = resChat;
							sql.transaction(
								function(tx){
									tx.executeSql(
										"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
										[user,chat],
										function(tx,result){
											if( result.rows!=null && result.rows.length>0 ){
												var tObj = result.rows.item(0);
												silenciado = tObj.silenciado==1;
											}
											app.initializeUser();
										},
										function(tx,error){
											app.initializeUser();
										}
									);
								}
							);
						});
					});
				});
				break;
			case 'chats':
				var c = new Chat();
				c.select(sql,filtroUsuario,false,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addChat(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Chats para mostrar</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						chat = $(this).attr("data-rel");
						limitOffset = 0;
						sql.transaction(
							function(tx){
								tx.executeSql(
									"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
									[user,chat],
									function(tx,result){
										if( result.rows!=null && result.rows.length>0 ){
											var tObj = result.rows.item(0);
											silenciado = tObj.silenciado==1;
										}
										app.initializeUser();
								},
								function(tx,error){
									app.initializeUser();
								}
							);
						}
					);
				});
			});
			break;
	}
	app.downloadUsers(function(){
		switch(tab){
			case 'grupos':
				var c = new Chat();
				c.select(sql,filtroUsuario,true,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addChat(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Grupos para mostrar</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						chat = $(this).attr("data-rel");
						sql.transaction(
							function(tx){
								tx.executeSql(
									"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
									[user,chat],
									function(tx,result){
										if( result.rows!=null && result.rows.length>0 ){
											var tObj = result.rows.item(0);
											silenciado = tObj.silenciado==1;
										}
										app.initializeUser();
									},
									function(tx,error){
										app.initializeUser();
									}
								);
							}
						);
					});
				});
				break;
			case 'usuarios':
				var c = new Contacto();
				c.select(sql,filtroUsuario,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addUser(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Contactos en tu lista</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						var contacto = $(this).attr("data-rel");
						var cct = new ChatContacto();
						cct.select(sql,contacto,function(resChat){
							chat = resChat;
							sql.transaction(
								function(tx){
									tx.executeSql(
										"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
										[user,chat],
										function(tx,result){
											if( result.rows!=null && result.rows.length>0 ){
												var tObj = result.rows.item(0);
												silenciado = tObj.silenciado==1;
											}
											app.initializeUser();
										},
										function(tx,error){
											app.initializeUser();
										}
									);
								}
							);
						});
					});
				});
				break;
			case 'chats':
				var c = new Chat();
				c.select(sql,filtroUsuario,false,function(contactos){
					$("#lista-usuarios").html("");
					if( contactos.length>0 ){
						for( var id in contactos ){
							app.addChat(contactos[id]);
						}
					} else {
						$("#lista-usuarios").html("<div class='usuario clearfix text-center'><h2>No hay Chats para mostrar</h2></div>");
					}
					navigator.notification.activityStop();
					$(".usuario").off("click");
					$(".usuario").on("click",function(e){
						$("#chat-window").html("");
						e.preventDefault();
						chat = $(this).attr("data-rel");
						sql.transaction(
							function(tx){
								tx.executeSql(
									"SELECT silenciado FROM chat_contacto WHERE contacto=? and chat=?",
									[user,chat],
									function(tx,result){
										if( result.rows!=null && result.rows.length>0 ){
											var tObj = result.rows.item(0);
											silenciado = tObj.silenciado==1;
										}
											app.initializeUser();
										},
										function(tx,error){
											app.initializeUser();
										}
									);
								}
							);
						});
					});
					break;
			}
			app.getNewMessages();
		});
	},
	downloadMessages: function(callback){
		if( (typeof secuencia === 'undefined' ) || (secuencia==null) ){
			secuencia = 0;
		}
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			var params = {
				user : user,
				secuencia : secuencia
			}
			$.ajax({
				url : url+'/gcm/getMessages.php',
				data : params,
				type : 'POST',
				dataType : 'json',
				success : function(result){
					if(result.status==0){
						for( var id in result.messages ){
							var mes = result.messages[id];
							if( parseInt(mes.secuencia)>parseInt(secuencia) ){
								secuencia = mes.secuencia;
							}
							var n = new Notificacion();
							n.insert(sql,mes,function(){
							});
						}
						window.localStorage.setItem("secuencia",secuencia);
					} else if( typeof result.errormessage !== 'undefined' ) {
						console.log(result.errormessage);
					} else {
						console.log(result);
					}
					if( callback ){
						callback();
					}
				},
				error: function(result){
					console.log(JSON.stringify(result));
					if( callback ){
						callback();
					}
				}
			});
		} else {
			if( callback ){
				callback();
			}
		}
	},
	downloadUsers: function(callback){
		if( (typeof navigator.connection!='undefined') && (navigator.connection.type!=Connection.NONE) ){
			var tablas = ['contacto','chat_contacto','chat'];
			for( var id in tablas ){
				var tabla = tablas[id];
				var seq = window.localStorage.getItem("secuencia-"+tabla);
				if( seq==null ){
					seq = 0;
					window.localStorage.setItem("secuencia-"+tabla,"0");
				}
				var data = {
					user:user,
					tabla:tabla,
					secuencia:seq
				};
				$.ajax({
					url:url+"/gcm/list-users.php",
					data:data,
					dataType:'json',
					type:'POST',
					success:function(resp){
						var t = resp.tabla;
						for( var id in resp.rows ){
							switch(t){
								case 'contacto':
									var c = new Contacto();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-contacto");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-contacto",c.secuencia);
									}
									break;
								case 'chat':
									var c = new Chat();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-chat");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-chat",c.secuencia);
									}
									break;
								case 'chat_contacto':
									var c = new ChatContacto();
									c.insert(sql,resp.rows[id]);
									var s = window.localStorage.getItem("secuencia-chat_contacto");
									if( !isNaN(s) && parseInt(s) < c.secuencia ){
										window.localStorage.setItem("secuencia-chat_contacto",c.secuencia);
									}
									break;
							}
						}
						if( callback && t=='chat'){ // chat es el ultimo elemento del arreglo
							callback();
						}
					},
					error:function(resp){
						console.log(JSON.stringify(resp));
						if( callback ){
							callback();
						}
					}
				});
			}
		} else {
			if( callback ){
				callback();
			}
		}
	},
	readMessages: function(mine){
		var n = new Notificacion();
		n.readMessages(sql,chat,false);
		var params = {
			user: user,
			chat: chat
		}
		$.ajax({
			url : url+"/gcm/read.php",
			data: params,
			type: 'POST',
			success: function(r){
			},
			error: function(e,error){
				console.log(JSON.stringify(e));
				console.log(error);
			}
		});
	},
	setTitle: function(){
		var tDom = $("#titulo");
		if( chat!=null ){
			switch(tab){
				case 'grupos':
					var c = new Chat();
					var title = '';
					var filter = " WHERE chat.id='"+chat+"'";// DEJAR SIEMPRE ESPACIO AL INICIO
					c.select(sql,filter,true,function(result){
						for( var id in result ){
							var cObj = result[id];
							if( typeof cObj !== 'undefined' ){
								silenciado = cObj.silenciado==1;
								tDom.html("<a href='#' onclick='backButton(); return false;' class='pull-left'><i class='fa fa-angle-left fa-2x'></i>");
								var foto = new Image();
								foto.src = cObj.foto;
								var imgCont = document.createElement("div")
								imgCont.className = "foto-usuario";
								imgCont.appendChild(foto);
								tDom.append(imgCont);
								tDom.append("</a>");
								tDom.append(cObj.display_name);
							}
						}
					});
					break;
				default:
					var c = new Chat();
					var title = '';
					var filter = " WHERE c.id='"+chat+"'";// DEJAR SIEMPRE ESPACIO AL INICIO
					c.select(sql,filter,false,function(result){
						for( var id in result ){
							var cObj = result[id];
							if( typeof cObj !== 'undefined' ){
								tDom.html("<a href='#' onclick='backButton(); return false;' class='pull-left'><i class='fa fa-angle-left fa-2x'></i></a>");
								var foto = new Image();
								foto.src = cObj.foto;
								var imgCont = document.createElement("div")
								imgCont.className = "foto-usuario";
								imgCont.appendChild(foto);
								tDom.append(imgCont);
								tDom.append("<span class='ver-usuario'>"+cObj.display_name+"</span>");
								$(".ver-usuario").off("click");
								$(".ver-usuario").on("click",function(e){
									//TODO: get user data and groups
									var contacto = new Contacto();
									contacto.select(
										sql,
										" WHERE idusuario in (select contacto from chat_contacto where contacto!='"+user+"' and chat='"+chat+"')",
										function(data){
											app.verFichaUsuario(data[0]);
										}
									);
								});
							}
						}
					});
					break;
			}
		} else {
			tDom.html("&nbsp;WebClass");
		}
	},
	resumeApp: function(){
		app.downloadMessages(function(){
			if( chat!=null ){
				app.populateMessages();
			} else {
				app.populateUsers();
			}
		});
	},
	inflateMenu: function(){
		if( chat==null ){
			if( tab=='grupos' ){
				var menu = [
					/*{
						id:'crear-grupo',
						text:'Crear Nuevo Grupo'
					}*/
				]
			} else {
				var menu = [];
			}
			menu.push(
				{
					id:'btn-logout',
					text:'Cerrar Sesión'
				}
			);
		} else {
			var menu = [
				{
					id:'ver-usuario',
					text:'Ver Usuario'
				},
				{
					id:'sacar-foto',
					text:'Adjuntar Archivo'
				}
			];
			if( !silenciado ){
				menu.push(
					{
						id:'silenciar-chat',
						text:'Silenciar Chat'
					}
				);
			} else {
				menu.push(
					{
						id:'silenciar-chat',
						text:'Cancelar Silencio'
					}
				);
			}
		}
		var source = $("#menu-template").html();
		var template = Handlebars.compile(source);
		$("#main-menu").html("");
		for( var id in menu ){
			var menuItem = menu[id];
			var result = template(menuItem);
			$("#main-menu").append(result);
		}
		app.eventListeners();
	},
	eventListeners: function(){
		$("#ver-usuario").off("click");
		$("#ver-usuario").on("click",function(e){
			//TODO: get user data and groups
			var contacto = new Contacto();
			contacto.select(
				sql,
				" WHERE idusuario in (select contacto from chat_contacto where contacto!='"+user+"' and chat='"+chat+"')",
				function(data){
					app.verFichaUsuario(data[0]);
				}
			);
		});
		$("#sacar-foto").off("click");
		$("#sacar-foto").on("click",function(e){
			//TODO: MAKE THE SOURCE OF PHOTO SELECTABLE
			$("#select-source").show('slow');
		});
		$("#select-source a").off("click");
		$("#select-source a").on("click",function(){
			$("#select-source").hide(1000);
			var action = parseInt($(this).attr("data-ref"));
			var image = true;
			switch( action ){
				case 1:
					var source = Camera.PictureSourceType.PHOTOLIBRARY;
					var destination = Camera.DestinationType.NATIVE_URI;
					break;
				case 2:
					var source = Camera.PictureSourceType.CAMERA;
					var destination = Camera.DestinationType.NATIVE_URI;
					break;
				case 3:
					image = false;
					break;
			}
			if( image ){
				navigator.camera.getPicture(onSuccess, onFail, { 
					quality			: 50,
					destinationType	: destination,
					sourceType		: source,
					correctOrientation:true,
					saveToPhotoAlbum:true/*,
					allowEdit		: true */
				});
			} else {
				$("#fileBrowser").show();
				browseFileSystem();
			}
			function onSuccess(imageURI) {
				
				
				var options = new FileUploadOptions();
				options.fileKey="file";
				options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
				
				window.resolveLocalFileSystemURL(
				imageURI,
				function(fileEntry){
					fileEntry.file(function(file){
						options.mimeType = file.type;
						options.chunkedMode = false;
						
						var ft = new FileTransfer();
						navigator.notification.activityStart("Enviando","Enviando foto...");
						ft.upload(imageURI, "http://didactica.pablogarin.cl/mobile/upload.php", win, fail, options);
					});
				},function(e){
					console.log("Error abriendo archivo.");
					console.dir(e);
				});
			}
			function onFail(message) {
				console.log(message);
				//alert('Failed because: ' + message);
			}
		});
		$("#silenciar-chat").off("click");
		$("#silenciar-chat").on("click",function(e){
			if( chat!=null ){
				if(silenciado){
					var msg = "¿Seguro desea cancelar silencio?";
				} else {
					var msg = "¿Seguro desea silenciar la conversación?";
				}
				navigator.notification.confirm(
					msg,
					function(buttonIndex){
						if( buttonIndex==2 ){
							var c = new ChatContacto();
							c.silenciar(sql,chat,function(silenced){
								if(silenced){
									var params = {
										chat:chat,
										user:user,
										state:(!silenciado?'1':'0')
									};
									silenciado=!silenciado;
									app.inflateMenu();
									$.ajax({
										url:url+"/gcm/silence.php",
										data:params,
										dataType:'json',
										success:function(r){
										}
									});
								}
							});
						}
					},
					"Silenciar Chat",
					['No','Si']
				);
			}
		});
		$("#btn-logout").off("click");
		$("#btn-logout").on("click",function(e){
			push.unregister(
			function(){
				app.setTitle();
				sql.transaction(
					function(tx){
						console.log("DELETING TABLES");
						tx.executeSql("delete from chat",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from chat_contacto",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from contacto",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
						tx.executeSql("delete from mensaje_chat",null,null,function(tx,error){ console.log(JSON.stringify(error)); });
					}
				);
				window.localStorage.clear();
				chat = null;
				user = null;
				app.onDeviceReady();
			}, function(){
				navigator.notification.alert("No se pudo realizar la acción",null,"Error");
			});
		});
	},
	verFichaUsuario: function(data){
		sql.transaction(
			function(tx){
				var contacto = data.idusuario;
				var query = "select id,foto as display_image, nombre as display_name from chat where grupo=1 and id in (select chat from chat_contacto where contacto=?)";
				tx.executeSql(
					query,
					[contacto],
					function(tx,result){
						if( (result.rows!=null) && (result.rows.length>0) ){
							data.grupos = true;
							data.grupoArray = [];
							for( var i=0; i<result.rows.length; i++ ){
								data.grupoArray.push(result.rows.item(i));
							}
						} else {
							data.grupos = false;
						}
						var source = $("#ficha-usuario-template").html();
						var template = Handlebars.compile(source);
						var view = template(data);
						$("#ficha-usuario").html("");
						$("#ficha-usuario").append(view);
						$(".heading, #chat, #usuarios, #search-group").hide();
						$("#main-content, #ficha-usuario").show();
						bannerUsuarioHeight.bg = $(".banner-usuario").height();
						bannerUsuarioHeight.span = ($(".banner-usuario span").css('font-size')).replace('px','');
						app.setUserBanner(true);
						window.addEventListener('scroll', function(e){
							app.setUserBanner(false);
						});
					},
					function(tx,error){
						console.log("ATENCION!!!");
						console.log(JSON.stringify(error));
					}
				);
			}
		);
	},
	setUserBanner: function(initial){
		var distanceY = window.pageYOffset || document.documentElement.scrollTop;
		var nh = bannerUsuarioHeight.bg-distanceY;
		if( initial ){
			var tmp = 0;
			if(nh<=56){
				tmp=57;
			} else {
				tmp = nh;
			}
			$(".banner-usuario.bg").show();
			$(".banner-usuario").css('background-position','0px '+50-((nh*250)/bannerUsuarioHeight.bg)/2+'px');
			$(".banner-usuario").height(tmp);
			var textHeight = ((tmp*250)/bannerUsuarioHeight.bg);
			$(".banner-usuario.bg").css('opacity',textHeight/250);
			if(textHeight<=100){
				textHeight = 100;
			}
			$(".banner-usuario span").css('font-size',textHeight+'%');
		} else {
			if( nh>56 ){
				$(".banner-usuario.bg").show();
				$(".banner-usuario").css('background-position','0px '+50-((nh*250)/bannerUsuarioHeight.bg)/2+'px');
				// $(".banner-usuario").css('background-position','0px '+-distanceY/2+'px');
				$(".banner-usuario").height(nh);
				var textHeight = ((nh*250)/bannerUsuarioHeight.bg);
				$(".banner-usuario.bg").css('opacity',textHeight/250);
				if(textHeight>100){
					$(".banner-usuario span").css('font-size',textHeight+'%');
				}
			} else {
				$(".banner-usuario.bg").hide();
				$(".banner-usuario").height(57);
				$(".banner-usuario span").css('font-size','100%');
			}
		}
	}
};

function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}
function timeSince(date) {
	var retval = "Hace ";
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
		retval += interval + " año";
		if( interval>1 ){
			retval+="s";
		}
        return retval;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
		retval += interval + " mes";
		if( interval>1 ){
			retval+="es";
		}
        return retval;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
		retval += interval + " día";
		if( interval>1 ){
			retval+="s";
		}
        return retval;
    }
	return formatAMPM(date);
	/*
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " horas";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutos";
    }
    return Math.floor(seconds) + " segundos";
	//*/
}
function backButton(){
	if( $("#file-browser").css("display")=='block' ){
		$("#file-browser .body ul#file-list").html("");
		$("#file-browser").hide();
		return;
	}
	if( $("#ficha-usuario").css("display")==='block' ){
		$("#ficha-usuario").html("").hide();
		$(".heading, #chat, #search-group").show();
		return;
	}
	if( buscar ){
		buscar = false;
		$("#tabs-usuarios").show();
		$(".heading").show();
		$("#search-group").hide();
		$("#lista-usuarios").css({marginTop:'3em'});
		return;
	}
	if( chat!=null ){
		chat = null;
		filtroUsuario = null;
		app.initializeUser();
		return;
	}
	navigator.app.exitApp();
}
function textToColor(text){
	if( typeof text === 'string' ){
		var color = '';
		var i = 0;
		while( i*3<text.length ){
			color += text.charCodeAt(i*3);
			i++;
		}
		color = Math.floor(color*16777215).toString(16);
		color = color.replace(/[0-5]/g,'');
		color = color.substr(0,6)
		return "#"+color;
	}
	return '#000000';
}
function downloadImage(imageURL,fileName){
	navigator.notification.activityStart("Abrir","Cargando archivo, por favor espere...");
	var filePath;
	window.requestFileSystem(
		LocalFileSystem.PERSISTENT, 
		0, 
		function(fileSystem){
			var directoryEntry = fileSystem.root;
			directoryEntry.getDirectory("WebClass", { create: true, exclusive: false }, function(){}, function(error){ alert("No se pudo crear la carpeta: "+error); }); 
			var rootdir = fileSystem.root;
			var fp = rootdir.toURL(); 
			filePath = fp + "WebClass/" +fileName;

			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
				fileSystem.root.getFile(filePath, { create: false }, fileExists, fileDoesNotExist);
			}, function(error){
				console.log(error);
			}); 
		}, 
		function(error){
			console.log(error);
		}
	);
	function fileDoesNotExist(){
		var fileTransfer = new FileTransfer();
		var uri = encodeURI(imageURL);

		fileTransfer.download(
			uri,
			filePath,
			function(entry) {
				fileExists(filePath);
			},
			function(error) {
				navigator.notification.activityStop();
				console.log("download error source " + error.source);
				console.log("download error target " + error.target);
				console.log("upload error code" + error.code);
			},
			false,
			{
				headers: {
					"Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
				}
			}
		);
	}
	function fileExists(){
		var ref = window.open(filePath, "_system", "location=yes")
		ref.addEventListener("loadstop",function(){
			navigator.notification.activityStop();
		});
	}
}
function browseFileSystem(folder){
	$("#file-browser").show();
	$("#file-browser .header span i.fa").off("click");
	$("#file-browser .header span i.fa").on("click",function(e){
		$("#file-browser").hide();
	});
	if( typeof folder === 'undefined' ){
		window.requestFileSystem(
			LocalFileSystem.PERSISTENT, 
			0,
			function(fileSystem){
				listDirectory(fileSystem.root);
			},
			function(e){
				console.log("Error");
				console.log(JSON.stringify(e));
			}
		);
	} else {
		listDirectory(folder);
	}
}
function compare(a,b) {
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}
function listDirectory(entry){
	var title = entry.fullPath;
	if( title.length>15 ){
		title = title.substr(0,15)+"...";
	}
	$("#file-browser .header span.title").html(title);
	var ls = entry.createReader();
	$("#file-browser .body ul#file-list").html("Cargando...");
	entry.getParent(
		function(parentDir){
			parentDir.name = "..";
			ls.readEntries(
				function(entries){
					var i;
					var dirs = [parentDir];
					var files = [];
					for (i=0; i<entries.length; i++) {
						var curr = entries[i];
						if( curr.name.charAt(0)==="." ){
							continue;
						}
						if(curr.isDirectory){
							dirs.push(curr);
						} else if(curr.isFile){
							files.push(curr);
						} else {
							console.log(JSON.stringify(curr));
						}
					}
					dirs = dirs.sort(compare);
					files.sort(compare);
					$("#file-browser ul#file-list").html("");
					i = 0;
					for(i = 0; i<dirs.length; i++){
						var li = document.createElement("li");
						var icon = document.createElement("i");
						icon.className="fa fa-folder-o fa-2x";
						li.appendChild(icon);
						li.appendChild(document.createTextNode( "  "+(dirs[i]).name ));
						li.setAttribute("data-ref",i);
						$("#file-browser ul#file-list").append(li);
					}
					for(i = 0; i<files.length; i++){
						var li = document.createElement("li");
						var icon = document.createElement("i");
						icon.className="fa fa-file-o fa-2x";
						li.appendChild(icon);
						li.appendChild(document.createTextNode( "  "+(files[i]).name ));
						li.setAttribute("data-ref",files[i].nativeURL);
						$("#file-browser ul#file-list").append(li);
					}
					$("#file-browser ul#file-list li").off("click");
					$("#file-browser ul#file-list li").on("click",function(e){
						$("#file-browser").hide();
						if( !isNaN($(this).attr("data-ref")) ){
							var index = parseInt( $(this).attr("data-ref") );
							browseFileSystem(dirs[index]);
						} else {
							var fileURI = $(this).attr("data-ref");
							
							var options = new FileUploadOptions();
							options.fileKey="file";
							options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
							
							window.resolveLocalFileSystemURL(
							fileURI,
							function(fileEntry){
								fileEntry.file(function(file){
									options.mimeType = file.type;
									options.chunkedMode = false;
									
									var ft = new FileTransfer();
									navigator.notification.activityStart("Enviando","Enviando archivo...");
									ft.upload(fileURI, "http://didactica.pablogarin.cl/mobile/upload.php", win, fail, options);
								});
							},function(e){
								console.log("Error abriendo archivo.");
								console.dir(e);
							});
						}
					});
				},
				function(e){
					console.log("Error");
					console.log(JOSN.strongofy(e));
				}
			);
		},
		function(e){
			console.log("Error");
			console.log(JSON.stringify(e));
		}
	);
}
function win(resp){
	console.log(JSON.stringify(resp));
	if( (resp.response).indexOf('Error') > -1 ){
		navigator.notification.alert("El archivo no se pudo enviar. Asegurese de que el formato es el correcto y que no supere los 8MB de tamaño.",null,"Error");
		return;
	}
	var message = resp.response;
	if( message.length>0 || message!='' ){
		var dt = new Date();
		var fecha = dt.getFullYear()+"-"+((dt.getMonth()+1)<10?'0'+(dt.getMonth()+1):(dt.getMonth()+1))+'-'+(dt.getDate()<10?'0'+dt.getDate():dt.getDate())+' '+(dt.getHours()<10?'0'+dt.getHours():dt.getHours())+':'+(dt.getMinutes()<10?'0'+dt.getMinutes():dt.getMinutes())+':'+(dt.getSeconds()<10?'0'+dt.getSeconds():dt.getSeconds());
		var postData = {
			remitente:user,
			chat:chat,
			message:message,
			fecha:fecha
		};
		$.ajax({
			url:url+"/gcm/send.php?push=true",
			data:postData,
			type:'POST',
			dataType:'json',
			success:function(resp){
				$("#inp-message").val("");
				resp.data.class = "fa fa-ellipsis-h";
				app.addMessage(resp.data);
				navigator.notification.activityStop();
			},
			error: function(resp,error){
				console.log(JSON.stringify(resp));
				console.log(error);
				navigator.notification.activityStop();
				navigator.notification.alert("No se pudo enviar el mensaje",function(){ $("#inp-message").focus(); },"Error");
			}
		});
	}
}
function fail(error){
	navigator.notification.activityStop();
}
