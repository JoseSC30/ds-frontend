import { ReactDiagram } from 'gojs-react';
import * as go from 'gojs';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firestore';
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

let myDiagram;
const Modern = {
    colors: {
        text: '#030712', // Gray 950
        comment: '#ca8a04', // Yellow 600
        link: '#4f46e5', // Indigo 600
        group: '#9ca3af44', // Gray 400, partially transparent
        outline: '#9ca3af', // Gray 400
        selection: '#ec4899', // Pink 500
        div: '#f3f4f6', // Gray 100
        gridMinor: '#d1d5db', // Gray 300
        gridMajor: '#9ca3af', // Gray 400
        overviewBox: '#ec4899', // Pink 500
        tempLink: '#0ea5e9', // Sky 500
        tempPort: '#ec4899', // Pink 500
        adornmentFill: '#ec4899', // Pink 500
        adornmentStroke: '#831843', // Pink 900
        dragSelect: '#ec4899', // Pink 500
    },
    fonts: {
        normal: '10pt sans-serif',
        bold: 'bold 12pt sans-serif',
    },
    numbers: {
        group: 1,
        selection: 3,
    },
    margins: {
        group: new go.Margin(5),
    },
    arrowheads: {
        toArrow: 'Standard',
    },
};
const ModernDark = {
    colors: {
        text: '#f3f4f6', // Gray 100
        comment: '#facc15', // Yellow 400
        link: '#818cf8', // Indigo 400
        group: '#9ca3af88', // Gray 400, partially transparent
        outline: '#9ca3af', // Gray 400
        selection: '#f472b6', // Pink 400
        div: '#111827', // Gray 900
        gridMinor: '#374151', // Gray 700
        gridMajor: '#4b5563', // Gray 600
        overviewBox: '#f472b6', // Pink 400
        tempLink: '#0ea5e9', // Sky 500
        tempPort: '#f472b6', // Pink 400
        adornmentFill: '#f472b6', // Pink 400
        adornmentStroke: '#9d174d', // Pink 800
        dragSelect: '#f472b6', // Pink 400
    },
    fonts: {
        normal: '10pt sans-serif',
        bold: 'bold 12pt sans-serif',
    },
    numbers: {
        group: 1,
        selection: 3,
    },
    margins: {
        group: new go.Margin(5),
    },
    arrowheads: {
        toArrow: 'Standard',
    },
};

function initDiagram() {
    myDiagram = new go.Diagram({
        // grid: go.GraphObject.make(go.Panel, 'Grid',
        //     { gridCellSize: new go.Size(25, 25) },
        //     go.GraphObject.make(go.Shape, 'LineH', { stroke: 'gray' }),
        //     go.GraphObject.make(go.Shape, 'LineV', { stroke: 'gray' })
        // ),
        allowDelete: true,
        allowCopy: true,
        allowUndo: true,
        allowZoom: true,
        allowSelect: true,
        'undoManager.isEnabled': true,
        'themeManager.themeMap': new go.Map([
            { key: 'light', value: Modern },
            { key: 'dark', value: ModernDark }
        ]),
        'themeManager.changesDivBackground': true,
        'themeManager.currentTheme': 'light',
        model: new go.GraphLinksModel(
            {
                linkKeyProperty: 'key',
            }
        )
    });

    myDiagram.themeManager.set('light', {
        colors: {
            primary: '#f7f9fc',
            green: '#62bd8e',
            blue: '#3999bf',
            purple: '#7f36b0',
            red: '#c41000'
        }
    });
    myDiagram.themeManager.set('dark', {
        colors: {
            primary: '#4a4a4a',
            green: '#429e6f',
            blue: '#3f9fc6',
            purple: '#9951c9',
            red: '#ff4d3d'
        }
    });

    // la plantilla para cada atributo en el array de datos de ítems de un nodo
    const itemTempl = new go.Panel('Horizontal', { margin: new go.Margin(2, 0) })
        .add(
            new go.TextBlock({
                font: '14px sans-serif',
                stroke: 'black',
                editable: true,
            })
                .bind(new go.Binding('text', 'name').makeTwoWay())
                .bind('font', 'iskey', (k) => (k ? 'italic 14px sans-serif' : '14px sans-serif'))
                .theme('stroke', 'text'),

            // Botón de eliminación de atributo
            go.GraphObject.make('Button', {
                alignment: go.Spot.Right,
                click: (e, obj) => {
                    const diagram = obj.part.diagram;
                    const node = obj.part.data;
                    const item = obj.data;  // Obtiene el ítem específico en la lista de ítems

                    if (!item) {
                        console.error('El ítem es nulo');
                        return;
                    }

                    console.log('Eliminando atributo:', item);

                    diagram.startTransaction('removeAttribute');
                    const updatedItems = (node.items || []).filter((i) => i !== item);

                    console.log('Items actualizados:', updatedItems);

                    diagram.model.setDataProperty(node, 'items', updatedItems);
                    diagram.commitTransaction('removeAttribute');
                }
            })
                .add(new go.Shape('XLine', {
                    width: 10,
                    height: 10,
                    stroke: 'red'
                }))  // símbolo de eliminación
        );

    // define la plantilla de Nodo, representando una entidad
    myDiagram.nodeTemplate = new go.Node('Auto', {
        selectionAdorned: true,
        resizable: true,
        layoutConditions: go.LayoutConditions.Standard & ~go.LayoutConditions.NodeSized,
        fromSpot: go.Spot.LeftRightSides,
        toSpot: go.Spot.LeftRightSides
    })
        .bindTwoWay('location')
        .bindObject('desiredSize', 'visible', (v) => new go.Size(NaN, NaN), undefined, 'LIST')
        .add(
            new go.Shape('RoundedRectangle', {
                stroke: '#e8f1ff',
                strokeWidth: 3
            })
                .theme('fill', 'primary'),
            new go.Panel('Table', {
                margin: 8,
                stretch: go.Stretch.Fill
            })
                .addRowDefinition(0, { sizing: go.Sizing.None })
                .add(
                    new go.TextBlock({
                        row: 0,
                        alignment: go.Spot.Center,
                        margin: new go.Margin(0, 24, 0, 2),
                        font: 'bold 18px sans-serif',
                        editable: true
                    })
                        .bind(new go.Binding('text', 'key').makeTwoWay())
                        .theme('stroke', 'text'),
                    go.GraphObject.build('PanelExpanderButton', {
                        row: 0,
                        alignment: go.Spot.TopRight
                    }, 'LIST')
                        .theme('ButtonIcon.stroke', 'text'),
                    new go.Panel('Table', {
                        name: 'LIST',
                        row: 1,
                        alignment: go.Spot.TopLeft
                    })
                        .add(
                            new go.TextBlock('Atributos', {
                                row: 0,
                                alignment: go.Spot.Left,
                                margin: new go.Margin(3, 24, 3, 2),
                                font: 'bold 15px sans-serif'
                            })
                                .theme('stroke', 'text'),

                            // Botón para agregar un nuevo atributo
                            go.GraphObject.make('Button', {
                                row: 0,
                                alignment: go.Spot.Right,
                                click: (e, obj) => {
                                    const node = obj.part.data;  // obtener los datos del nodo
                                    const diagram = obj.part.diagram;

                                    diagram.startTransaction('addAttribute');

                                    const newAttr = { name: 'Nuevo Atributo', iskey: false };  // nuevo atributo por defecto
                                    const updatedItems = (node.items || []).concat([newAttr]);  // Crear un nuevo array con el nuevo atributo
                                    diagram.model.setDataProperty(node, 'items', updatedItems);  // actualizar el modelo

                                    diagram.commitTransaction('addAttribute');
                                }
                            })
                                .add(new go.TextBlock('ADD', {
                                    font: '14px sans-serif',
                                    stroke: 'green',
                                    margin: new go.Margin(0, 5, 0, 5)
                                })),

                            new go.Panel('Vertical', {
                                row: 1,
                                name: 'NonInherited',
                                alignment: go.Spot.TopLeft,
                                defaultAlignment: go.Spot.Left,
                                itemTemplate: itemTempl
                            })
                                .bind('itemArray', 'items'),
                            new go.TextBlock('Atributos heredados', {
                                row: 2,
                                alignment: go.Spot.Left,
                                margin: new go.Margin(3, 24, 3, 2),
                                font: 'bold 15px sans-serif'
                            })
                                .bind('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0)
                                .theme('stroke', 'text'),
                            go.GraphObject.build('PanelExpanderButton', {
                                row: 2,
                                alignment: go.Spot.Right
                            }, 'Inherited')
                                .bind('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0)
                                .theme('ButtonIcon.stroke', 'text'),
                            new go.Panel('Vertical', {
                                row: 3,
                                name: 'Inherited',
                                alignment: go.Spot.TopLeft,
                                defaultAlignment: go.Spot.Left,
                                itemTemplate: itemTempl
                            })
                                .bind('itemArray', 'inheritedItems')
                        )
                )
        );

    // define la plantilla de Enlace, representando una relación
    myDiagram.linkTemplate = new go.Link({
        selectionAdorned: true,
        layerName: 'Background',
        reshapable: true,
        routing: go.Routing.AvoidsNodes,
        corner: 5,
        curve: go.Curve.JumpOver
    })
        .add(
            new go.Shape({
                stroke: '#f7f9fc',
                strokeWidth: 3
            })
                .theme('stroke', 'link')
                .bind(new go.Binding('strokeDashArray', 'tipo', (tipo) => tipo === 'dependencia' ? [5, 5] : null)),

            new go.Shape({
                toArrow: "Triangle",
                fill: "black",
                stroke: "black",
                scale: 1.5
            })
                .bind(new go.Binding('visible', 'tipo', (tipo) => tipo === 'herencia')),

            new go.Shape({
                toArrow: "OpenTriangle",
                fill: "black",
                stroke: "black",
                scale: 1.5
            })
                .bind(new go.Binding('visible', 'tipo', (tipo) => tipo === 'dependencia')),

            new go.Shape({
                toArrow: "StretchedDiamond",
                fill: "white",
                stroke: "black",
                scale: 2
            })
                .bind(new go.Binding('visible', 'tipo', (tipo) => tipo === 'agregacion')),

            new go.Shape({
                toArrow: "StretchedDiamond",
                fill: "black",
                stroke: "black",
                scale: 2
            })
                .bind(new go.Binding('visible', 'tipo', (tipo) => tipo === 'composicion')),

            new go.TextBlock({
                textAlign: 'center',
                font: 'bold 14px sans-serif',
                stroke: 'black',
                segmentIndex: 0,
                segmentOffset: new go.Point(NaN, NaN),
                segmentOrientation: go.Orientation.Upright
            })
                .bind(new go.Binding('text').makeTwoWay())
                .theme('stroke', 'text'),

            new go.TextBlock({
                textAlign: 'center',
                font: 'bold 14px sans-serif',
                stroke: 'black',
                segmentIndex: -1,
                segmentOffset: new go.Point(NaN, NaN),
                segmentOrientation: go.Orientation.Upright
            })
                .bind(new go.Binding('text', 'toText').makeTwoWay())
                .theme('stroke', 'text')
        );

    return myDiagram;
}

const cambioDeTema = () => {
    if (myDiagram) {
        myDiagram.themeManager.currentTheme = document.getElementById('theme').value;
    }
};

export default function DiagramaClases() {

    // const { nombreDiagrama } = useParams();
    // const location = useLocation();
    // const { coleccion } = location.state?.coleccion;
    const { nombreDiagrama, coleccion, existe } = useParams();
    const navigate = useNavigate();
    //------
    async function guardarDiagrama() {
        if (myDiagram) {
            const data = myDiagram.model.toJson();
            try {
                await setDoc(doc(db, nColeccion, nDiagrama), { data: data });
                console.log("Diagrama guardado exitosamente en Firestore");
            } catch (error) {
                console.error("Error al guardar el diagrama: ", error);
            }
        }
    }

    function descargarDiagramaEnTxt() {
        const data = myDiagram.model.toJson();
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagrama.txt';
        a.click();
    }

    async function subirDiagrama() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target.result;
                myDiagram.model = go.Model.fromJson(data);
                await guardarDiagrama(); // Guardar en Firestore después de cargar
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function crearTabla() {
        const nuevaLocacionDelNodo = new go.Point(
            Math.random() * 100,
            Math.random() * 100
        );
        myDiagram.model.addNodeData({
            key: 'TableName',
            location: nuevaLocacionDelNodo,
            items: [
                { name: 'id', iskey: true },
                { name: 'Attribute', iskey: false }
            ]
        });
        guardarDiagrama(); // Guardar después de crear una nueva tabla
    }

    let linkCounter = 0;

    function crearRelacion(from, to, text, toText, tipo) {
        console.log("Creando relación:", { from, to, text, toText, tipo });
        myDiagram.model.addLinkData({
            key: `link${linkCounter++}`,
            from: from,
            to: to,
            text: text,
            toText: toText,
            tipo: tipo
        });
        guardarDiagrama(); // Guardar después de crear una nueva relación
    }
    //------

    const [modelo, setModelo] = useState({
        class: "go.GraphLinksModel",
        linkKeyProperty: "key",
        nodeDataArray: [],
        linkDataArray: []
    });
    // Estados para crear relaciones
    const [fromTable, setFromTable] = useState('');
    const [toTable, setToTable] = useState('');
    const [text, setText] = useState('');
    const [toText, setToText] = useState('');
    const [tipo, setTipo] = useState('asociacion');
    //-----------------------------
    const [tables, setTables] = useState([]);
    const [isLocalChange, setIsLocalChange] = useState(false);
    const diagramRef = useRef(null);
    //------------------------------
    const [nColeccion, setNColeccion] = useState(coleccion);
    const [nDiagrama, setNDiagrama] = useState(nombreDiagrama);

    useEffect(() => {
        const loadDiagram = async () => {
            if (myDiagram) {
                // if (diagrams.find(diagram => diagram.id === nombreDiagrama))
                if (existe === "true") {
                    await cargarDiagramaDesdeFirestore();
                    console.log("Suecia");
                } else {
                    myDiagram.model = new go.GraphLinksModel({
                        linkKeyProperty: "key",
                        nodeDataArray: modelo.nodeDataArray,
                        linkDataArray: modelo.linkDataArray
                    });
                }
                diagramRef.current = myDiagram;
                myDiagram.addModelChangedListener((e) => {
                    if (e.isTransactionFinished) {
                        setIsLocalChange(true);
                        setModelo({
                            ...modelo,
                            nodeDataArray: myDiagram.model.nodeDataArray,
                            linkDataArray: myDiagram.model.linkDataArray
                        });
                        updateTables();
                    }
                });
            }

            // Configurar un listener para cambios en tiempo real (de Firestore a la app)
            const unsubscribe = onSnapshot(doc(db, nColeccion, nDiagrama), (doc) => {
                if (doc.exists()) {
                    const data = doc.data().data;
                    setIsLocalChange(false);
                    myDiagram.model = go.Model.fromJson(data);
                }
            });
            // Limpiar el listener cuando el componente se desmonte//
            return () => unsubscribe();
        };

        loadDiagram();
    }, []);

    const cargarDiagramaDesdeFirestore = async () => {
        const docRef = doc(db, nColeccion, nDiagrama);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("ZZDocument data:", docSnap.data().data);
            const data = docSnap.data().data;
            myDiagram.model = go.Model.fromJson(data);
            console.log("espania");
            // setIsLocalChange(false);
            // setIsLocalChange(true);
        }
    };

    useEffect(() => {
        if (isLocalChange) {
            guardarDiagrama();
            setIsLocalChange(false);
        }
    }, [modelo, isLocalChange]);

    const updateTables = () => {
        const tableNames = diagramRef.current.model.nodeDataArray.map(node => node.key);
        setTables(tableNames);
    };

    const handleCreateRelation = () => {
        if (fromTable && toTable && text && toText) {
            crearRelacion(fromTable, toTable, text, toText, tipo);
        } else {
            alert('Por favor, complete todos los campos para crear la relación.');
        }
    };

    const unirseAOtroProyecto = () => {
        const existe = true;
        navigate(`/diagrama/${nDiagrama}/${nColeccion}/${existe}`);
        //refrescar la pagina actual
        window.location.reload();
    }

    return (
        <div>
            <nav className="navbar">
                {/* ... (mantener los botones y controles existentes) */}
                <div className="container-fluid">
                    <button type="button" className="btn-cel btn-primary">Invitar Colaboradores</button>
                </div>
                <div className="container-fluid">
                    <button id="SaveButton" className="btn btn-secondary" onClick={guardarDiagrama}>Guardar</button>
                    <button className="btn btn-secondary" onClick={descargarDiagramaEnTxt}>Descargar</button>
                    <button className="btn btn-secondary" onClick={subirDiagrama}>Importar</button>
                </div>
                <div className="container-fluid">
                    <span className="texto-blanco">{nDiagrama}</span>
                    <br />
                </div>
            </nav>
            <div className='main-container'>
                <div className="panel-uno">
                    <div className='left-container'>
                        <p className='subtitulos'>HERRAMIENTAS</p>
                        <button className="btn" onClick={crearTabla}>Crear Tabla</button>
                        <br />
                        <button className="btn" onClick={() => myDiagram.commandHandler.undo()}>Deshacer Cambios</button>
                        <br />
                        <button className="btn" onClick={() => myDiagram.commandHandler.deleteSelection()}>Eliminar Seleccion</button>
                        <select id="theme" onChange={cambioDeTema} defaultValue="light">
                            <option value="light">Tema Claro</option>
                            <option value="dark">Tema Oscuro</option>
                        </select>
                        <div>
                            <h4>Crear Relación</h4>
                            <select value={fromTable} onChange={(e) => setFromTable(e.target.value)}>
                                <option value="">Seleccione tabla origen</option>
                                {tables.map(table => (
                                    <option key={table} value={table}>{table}</option>
                                ))}
                            </select>
                            <select value={toTable} onChange={(e) => setToTable(e.target.value)}>
                                <option value="">Seleccione tabla destino</option>
                                {tables.map(table => (
                                    <option key={table} value={table}>{table}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Texto de relación"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Texto de destino"
                                value={toText}
                                onChange={(e) => setToText(e.target.value)}
                            />
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                <option value="asociacion">Asociación</option>
                                <option value="herencia">Herencia</option>
                                <option value="dependencia">Dependencia</option>
                                <option value="agregacion">Agregacion</option>
                                <option value="composicion">Composicion</option>
                            </select>
                            <button onClick={handleCreateRelation}>Crear Relación</button>
                        </div>
                        {/* Apartado para unirse a otro diagrama, poniendo el nColeccion y nDiagrama */}
                        <div>
                            <h4>Unirse a otro diagrama</h4>
                            <input
                                type="text"
                                placeholder="Colección"
                                value={nColeccion}
                                onChange={(e) => setNColeccion(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Nombre del diagrama"
                                value={nDiagrama}
                                onChange={(e) => setNDiagrama(e.target.value)}
                            />
                            {/* <button onClick={() => cargarDiagramaDesdeFirestore()}>Unirse</button> */}
                            <button onClick={() => unirseAOtroProyecto()}>Unirse</button>
                            </div>
                    </div>

                </div>
                <ReactDiagram
                    initDiagram={initDiagram}
                    divClassName='diagram-component'
                    nodeDataArray={modelo.nodeDataArray}
                    linkDataArray={modelo.linkDataArray}
                />
            </div>
        </div>
    );
}