import { ReactDiagram } from 'gojs-react';
import * as go from 'gojs';
import React from 'react';

let myDiagram;

function init() {
  const $ = go.GraphObject.make;
  myDiagram = $(go.Diagram, {
    allowCopy: false,
    //Aparece el grid en el diagrama
    grid: $(go.Panel, 'Grid',
      $(go.Shape, 'LineH', { stroke: 'lightgray', strokeWidth: 0.5 }),
      $(go.Shape, 'LineH', { stroke: 'gray', strokeWidth: 0.5, interval: 10 }),
      $(go.Shape, 'LineV', { stroke: 'lightgray', strokeWidth: 0.5 }),
      $(go.Shape, 'LineV', { stroke: 'gray', strokeWidth: 0.5, interval: 10 })
    ),
    linkingTool: $(MessagingTool), // definido abajo
    'resizingTool.isGridSnapEnabled': true,
    draggingTool: $(MessageDraggingTool), // definido abajo
    'draggingTool.gridSnapCellSize': new go.Size(1, MessageSpacing / 4),
    'draggingTool.isGridSnapEnabled': true,
    // automatically extend Lifelines as Activities are moved or resized
    SelectionMoved: ensureLifelineHeights,
    PartResized: ensureLifelineHeights,
    'undoManager.isEnabled': true,
    model: $(go.GraphLinksModel,
      {
        linkKeyProperty: 'key'
      }
    ),
  });

  // when the document is modified, add a "*" to the title and enable the "Save" button
  myDiagram.addDiagramListener('Modified', (e) => {
    const button = document.getElementById('SaveButton');
    if (button) button.disabled = !myDiagram.isModified;
    const idx = document.title.indexOf('*');
    if (myDiagram.isModified) {
      if (idx < 0) document.title += '*';
    } else {
      if (idx >= 0) document.title = document.title.slice(0, idx);
    }
  });

  // define the Lifeline Node template.
  myDiagram.groupTemplate = $(go.Group,
    'Vertical',
    {
      locationSpot: go.Spot.Bottom,
      locationObjectName: 'HEADER',
      minLocation: new go.Point(0, 0),
      maxLocation: new go.Point(9999, 0),
      selectionObjectName: 'HEADER',
    },
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
    $(go.Panel,
      'Auto',
      { name: 'HEADER' },
      $(go.Shape, 'Rectangle', {
        // fill: $(go.Brush, 'Linear', { 0: '#bbdefb', 1: go.Brush.darkenBy('#bbdefb', 0.1) }),//Color de actor
        fill: $(go.Brush, 'Linear', { 0: '#3C5B6F', 1: go.Brush.darkenBy('#3C5B6F', 0.1) }),//Color de actor
        stroke: null,
      }),
      $(go.TextBlock,
        {
          margin: 5,
          font: '400 12pt Source Sans Pro, sans-serif',//Fuente de actor
          //Color de la letra
          stroke: 'white',
          //Editar nombre de la linea de vida
          isMultiline: false,
          editable: true,
          textEdited: function(tb) {
            var node = tb.part;
            if (node instanceof go.Node) {
              var data = node.data;
              if (data !== null) {
                myDiagram.model.setDataProperty(data, 'text', tb.text);
              }
            }
          }
        },
        new go.Binding('text', 'text')
      )
    ),
    $(go.Shape,
      {
        figure: 'LineV',
        fill: null,
        stroke: 'black',
        strokeDashArray: [3, 3],
        width: 1,
        alignment: go.Spot.Center,
        portId: '',
        fromLinkable: true,
        fromLinkableDuplicates: true,
        toLinkable: true,
        toLinkableDuplicates: true,
        cursor: 'pointer',
      },
      new go.Binding('height', 'duration', computeLifelineHeight)
    )
  );

  

  // define the Activity Node template
  myDiagram.nodeTemplate = $(go.Node,
    {
      locationSpot: go.Spot.Top,
      locationObjectName: 'SHAPE',
      minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
      maxLocation: new go.Point(NaN, 19999),
      selectionObjectName: 'SHAPE',
      resizable: true,
      resizeObjectName: 'SHAPE',
      resizeAdornmentTemplate: $(go.Adornment,
        'Spot',
        $(go.Placeholder),
        $(go.Shape, // only a bottom resize handle
          {
            alignment: go.Spot.Bottom,
            cursor: 'col-resize',
            desiredSize: new go.Size(6, 6),
            fill: 'yellow',
          }
        )
      ),
    },
    new go.Binding('location', '', computeActivityLocation).makeTwoWay(backComputeActivityLocation),
    $(go.Shape,
      'Rectangle',
      {
        name: 'SHAPE',
        fill: '#FFC470',
        stroke: 'black',
        width: ActivityWidth,
        // allow Activities to be resized down to 1/4 of a time unit
        minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25)),
      },
      new go.Binding('height', 'duration', computeActivityHeight).makeTwoWay(backComputeActivityHeight)
    )
  );

  // define the Message Link template.
  myDiagram.linkTemplate = $(MessageLink, // defined below
    { selectionAdorned: true, curviness: 0 },
    $(go.Shape, 'Rectangle', { stroke: 'black' }),
    $(go.Shape, { toArrow: 'OpenTriangle', stroke: 'black' }),
    $(go.TextBlock,
      {
        font: '400 9pt Source Sans Pro, sans-serif',
        segmentIndex: 0,
        segmentOffset: new go.Point(NaN, NaN),
        isMultiline: false,
        editable: true,
      },
      new go.Binding('text', 'text').makeTwoWay()
    )
  );

  // create the graph by reading the JSON data saved in "mySavedModel" textarea element
  // load();

  return myDiagram;
}

function ensureLifelineHeights(e) {
  // iterate over all Activities (ignore Groups)
  const arr = myDiagram.model.nodeDataArray;
  let max = -1;
  for (let i = 0; i < arr.length; i++) {
    const act = arr[i];
    if (act.isGroup) continue;
    max = Math.max(max, act.start + act.duration);
  }
  if (max > 0) {
    // now iterate over only Groups
    for (let i = 0; i < arr.length; i++) {
      const gr = arr[i];
      if (!gr.isGroup) continue;
      if (max > gr.duration) {
        // this only extends, never shrinks
        myDiagram.model.setDataProperty(gr, 'duration', max);
      }
    }
  }
}

// some parameters
const LinePrefix = 20; // vertical starting point in document for all Messages and Activations
const LineSuffix = 30; // vertical length beyond the last message time
const MessageSpacing = 20; // vertical distance between Messages at different steps
const ActivityWidth = 10; // width of each vertical activity bar
const ActivityStart = 5; // height before start message time
const ActivityEnd = 5; // height beyond end message time

function computeLifelineHeight(duration) {
  return LinePrefix + duration * MessageSpacing + LineSuffix;
}

function computeActivityLocation(act) {
  const groupdata = myDiagram.model.findNodeDataForKey(act.group);
  if (groupdata === null) return new go.Point();
  // get location of Lifeline's starting point
  const grouploc = go.Point.parse(groupdata.loc);
  return new go.Point(grouploc.x, convertTimeToY(act.start) - ActivityStart);
}
function backComputeActivityLocation(loc, act) {
  myDiagram.model.setDataProperty(act, 'start', convertYToTime(loc.y + ActivityStart));
}

function computeActivityHeight(duration) {
  return ActivityStart + duration * MessageSpacing + ActivityEnd;
}
function backComputeActivityHeight(height) {
  return (height - ActivityStart - ActivityEnd) / MessageSpacing;
}

// time is just an abstract small non-negative integer
// here we map between an abstract time and a vertical position
function convertTimeToY(t) {
  return t * MessageSpacing + LinePrefix;
}
function convertYToTime(y) {
  return (y - LinePrefix) / MessageSpacing;
}

// a custom routed Link
class MessageLink extends go.Link {
  constructor() {
    super();
    this.time = 0; // use this "time" value when this is the temporaryLink
  }

  getLinkPoint(node, port, spot, from, ortho, othernode, otherport) {
    const p = port.getDocumentPoint(go.Spot.Center);
    const r = port.getDocumentBounds();
    const op = otherport.getDocumentPoint(go.Spot.Center);

    const data = this.data;
    const time = data !== null ? data.time : this.time; // if not bound, assume this has its own "time" property

    const aw = this.findActivityWidth(node, time);
    const x = op.x > p.x ? p.x + aw / 2 : p.x - aw / 2;
    const y = convertTimeToY(time);
    return new go.Point(x, y);
  }

  findActivityWidth(node, time) {
    let aw = ActivityWidth;
    if (node instanceof go.Group) {
      // see if there is an Activity Node at this point -- if not, connect the link directly with the Group's lifeline
      if (
        !node.memberParts.any((mem) => {
          const act = mem.data;
          return act !== null && act.start <= time && time <= act.start + act.duration;
        })
      ) {
        aw = 0;
      }
    }
    return aw;
  }

  getLinkDirection(node, port, linkpoint, spot, from, ortho, othernode, otherport) {
    const p = port.getDocumentPoint(go.Spot.Center);
    const op = otherport.getDocumentPoint(go.Spot.Center);
    const right = op.x > p.x;
    return right ? 0 : 180;
  }

  computePoints() {
    if (this.fromNode === this.toNode) {
      // also handle a reflexive link as a simple orthogonal loop
      const data = this.data;
      const time = data !== null ? data.time : this.time; // if not bound, assume this has its own "time" property
      const p = this.fromNode.port.getDocumentPoint(go.Spot.Center);
      const aw = this.findActivityWidth(this.fromNode, time);

      const x = p.x + aw / 2;
      const y = convertTimeToY(time);
      this.clearPoints();
      this.addPoint(new go.Point(x, y));
      this.addPoint(new go.Point(x + 50, y));
      this.addPoint(new go.Point(x + 50, y + 5));
      this.addPoint(new go.Point(x, y + 5));
      return true;
    } else {
      return super.computePoints();
    }
  }
}
// end MessageLink

class MessagingTool extends go.LinkingTool {
  constructor() {
    super();

    const $ = go.GraphObject.make;
    this.temporaryLink = $(MessageLink,
      $(go.Shape, 'Rectangle', { stroke: 'magenta', strokeWidth: 2 }),
      $(go.Shape, { toArrow: 'OpenTriangle', stroke: 'magenta' })
    );
  }

  doActivate() {
    super.doActivate();
    const time = convertYToTime(this.diagram.firstInput.documentPoint.y);
    this.temporaryLink.time = Math.ceil(time); // round up to an integer value
  }

  insertLink(fromnode, fromport, tonode, toport) {
    const newlink = super.insertLink(fromnode, fromport, tonode, toport);
    if (newlink !== null) {
      const model = this.diagram.model;
      // specify the time of the message
      const start = this.temporaryLink.time;
      const duration = 1.5;
      newlink.data.time = start;
      model.setDataProperty(newlink.data, 'text', 'siguiente');
      // and create a new Activity node data in the "to" group data
      const newact = {
        group: newlink.data.to,
        start: start,
        duration: duration,
      };
      model.addNodeData(newact);
      // now make sure all Lifelines are long enough
      ensureLifelineHeights();
    }
    return newlink;
  }
}

class MessageDraggingTool extends go.DraggingTool {
  // override the standard behavior to include all selected Links,
  // even if not connected with any selected Nodes
  computeEffectiveCollection(parts, options) {
    const result = super.computeEffectiveCollection(parts, options);
    // add a dummy Node so that the user can select only Links and move them all
    result.add(new go.Node(), new go.DraggingInfo(new go.Point()));
    // normally this method removes any links not connected to selected nodes;
    // we have to add them back so that they are included in the "parts" argument to moveParts
    parts.each((part) => {
      if (part instanceof go.Link) {
        result.add(part, new go.DraggingInfo(part.getPoint(0).copy()));
      }
    });
    return result;
  }

  // override to allow dragging when the selection only includes Links
  mayMove() {
    return !this.diagram.isReadOnly && this.diagram.allowMove;
  }

  // override to move Links (which are all assumed to be MessageLinks) by
  // updating their Link.data.time property so that their link routes will
  // have the correct vertical position
  moveParts(parts, offset, check) {
    super.moveParts(parts, offset, check);
    const it = parts.iterator;
    while (it.next()) {
      if (it.key instanceof go.Link) {
        const link = it.key;
        const startY = it.value.point.y; // DraggingInfo.point.y
        let y = startY + offset.y; // determine new Y coordinate value for this link
        const cellY = this.gridSnapCellSize.height;
        y = Math.round(y / cellY) * cellY; // snap to multiple of gridSnapCellSize.height
        const t = Math.max(0, convertYToTime(y));
        link.diagram.model.set(link.data, 'time', t);
        link.invalidateRoute();
      }
    }
  }
}

//Funcion para descargar el diagrama en su formato JSON, en un archivo txt.
function descargarArchivoSDS() {
  const text = myDiagram.model.toJson();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'diagrama.sds';
  link.click();
}

//Funcion para crear un nuevo diagrama.
function nuevoDiagrama() {
  myDiagram.model = new go.GraphLinksModel();
}

//Funcion para subir un archivo txt y cargarlo en el diagrama.
function subirArchivo() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.sds';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      myDiagram.model = go.Model.fromJson(text);
    };
    reader.readAsText(file);
  };
  input.click();
}

function descargarSVG() {
  const svg = myDiagram.makeSvg({
    scale: 1,
    background: 'white',
    documentTitle: 'Diagrama de secuencia',
  });
  const svgstr = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgstr], { type: 'image/svg+xml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'diagrama.svg';
  link.click();
}

function descargarPNG() {
  const img = myDiagram.makeImage({
    scale: 2,
    background: 'white',
    type: 'image/png',
  });
  const link = document.createElement('a');
  link.href = img.src;
  link.download = 'diagrama.png';
  link.click();
}

function crearNuevoActor() {
  const actores = myDiagram.model.nodeDataArray;
  let aux = 1;
  const longitud = actores.length;
  for (let i = 0; i < longitud; i++) {
    const actor = actores[i];
    //Consulto si la primera parte del key es igual a actor
    if (typeof actor.key === 'string' && actor.key.substring(0, 2) === 'lv') {
      aux++;
    }
  }
  myDiagram.model.addNodeData({
    key: 'lv' + (aux),
    text: 'Objeto ' + (aux),
    isGroup: true,
    loc: '0 0',
    duration: 12,
  });
}

export default function Diagrama() {
  var modelo = React.useState(JSON.stringify({
    class: "go.GraphLinksModel",
    nodeDataArray: [],
    linkDataArray: []
  }, null, 2));

  function guardarDiagrama() {
    modelo = myDiagram.model.toJson();
    myDiagram.isModified = true;//
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container-fluid">
          <button type="button" className="btn-cel btn-primary" onClick={nuevoDiagrama}>Nuevo Diagrama</button>
          <button type="button" className="btn-cel btn-primary">Invitar Colaboradores</button>
        </div>
        <div className="container-fluid">
          <button id="SaveButton" className="btn btn-secondary" onClick={guardarDiagrama} disabled="">Guardar</button>
          <button className="btn btn-secondary" onClick={descargarArchivoSDS}>Descargar</button>
          <button className="btn btn-secondary" onClick={subirArchivo}>Importar</button>
        </div>
        <div className="container-fluid">
          <span className="texto-blanco">Exportar en Formato</span>
          <br />
          <button className="btn" onClick={descargarSVG}>SVG</button>
          <button className="btn" onClick={descargarPNG}>PNG</button>
        </div>
        <div className="container-fluid">
          <span className="texto-blanco">JUAN GOMEZ</span>
          <br />
          <button type="button" className="btn btn-danger navbar-btn">Cerrar Sesión</button>
        </div>
      </nav>
      <div className='main-container'>
        <div className="panel-uno">
          <div className='left-container'>
              <p className='subtitulos'>HERRAMIENTAS</p>
              <button className="btn" onClick={crearNuevoActor}>Crear Linea de Vida</button>
              <br />
              <button className="btn" onClick={() => myDiagram.commandHandler.undo()}>Deshacer Cambios</button>
              <br />
              <button className="btn" onClick={() => myDiagram.commandHandler.deleteSelection()}>Eliminar Seleccion</button> 
          </div>
        </div>
        <ReactDiagram
          initDiagram={init}
          divClassName='diagram-component'
          nodeDataArray={modelo.nodeDataArray}
          linkDataArray={modelo.linkDataArray}
        />
      </div>
    </div>
  );
}
