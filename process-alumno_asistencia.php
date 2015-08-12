<?php
$data_req = $_REQUEST['data'];
foreach( $data_req as $k=>$v ){
	$cursor = $sql->readDB("alumno_asistencia","id_alumno='".$v['id_alumno']."' and fecha='".$v['fecha']."' and ultima_modificacion>".$v['ultima_modificacion']."");
	if( $cursor && $cursor->num_rows>0 ){
		unset($data_req[$k]);
	}
}
$_REQUEST['data'] = $data_req;
?>
