function Navbar() {
    return (
        <nav className="navbar">
            <div className="container-fluid">
                <button type="button" className="btn btn-primary navbar-btn">Nuevo</button>
                {/* Al darle click al siguiente boton "Importar", me va a permitir subir un archivo txt/ */}
                <button type="button" className="btn btn-secondary navbar-btn">Importar</button>
            </div>
            <div className="container-fluid">
                <button type="button" className="btn btn-success navbar-btn">Guardar</button>
                <button type="button" className="btn btn-warning navbar-btn">Exportar</button>
                <button type="button" className="btn btn-info navbar-btn">Invitar Colaboradores</button>
            </div>
            <div className="container-fluid">
                <span className="navbar-text">JUAN GOMEZ</span>
                <br/>
                <button type="button" className="btn btn-danger navbar-btn">Cerrar Sesión</button>
            </div>
        </nav>
    );
}

export default Navbar;