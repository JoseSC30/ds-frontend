import React, { useState, useEffect } from "react";
import { collection, getDocs, setDoc, doc, getDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Principal.css";

function crearDiagrama(docu, diagrams, userEmail) {
    if (!diagrams.find(diagram => diagram.id === docu)) {
        var modelo = JSON.stringify({
            class: "GraphLinksModel",
            linkKeyProperty: "key",
            nodeDataArray: [],
            linkDataArray: []
        });
        setDoc(doc(db, userEmail, docu), { data: modelo });
    } else {
        setDoc(doc(db, userEmail, docu), { data: diagrams.find(diagram => diagram.id === docu).data });
    }
}

export default function Principal() {
    const [diagrams, setDiagrams] = useState([]);
    const [nombreNuevoDiagrama, setNombreNuevoDiagrama] = useState("");
    const [diagramaSeleccionado, setDiagramaSeleccionado] = useState("");
    //---
    const [diagramaTercero, setDiagramaTercero] = useState("");
    const [userTercero, setUserTercero] = useState("");
    //---

    const [user, setUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                verificarYCrearColeccionUsuario(currentUser.email);
            }
        });

        return () => unsubscribe();
    }, []);

    const verificarYCrearColeccionUsuario = async (userEmail) => {
        const userCollectionRef = collection(db, userEmail);
        const userCollectionSnapshot = await getDocs(userCollectionRef);

        if (userCollectionSnapshot.empty) {
            // La colección no existe, la creamos con un documento inicial
            await setDoc(doc(db, userEmail, "Proyecto Vacio"), { created: new Date() });
        }

        // Después de verificar/crear la colección, obtenemos los diagramas
        fetchDiagrams(userEmail);
    };

    const fetchDiagrams = async (userEmail) => {
        const querySnapshot = await getDocs(collection(db, userEmail));
        const diagramsList = querySnapshot.docs
            .filter(doc => doc.id !== "initial") // Excluimos el documento inicial
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        setDiagrams(diagramsList);
    };

    const obtenerDocDeDiagramaSeleccionado = async () => {
        if (!user) return;
        const docRef = doc(db, user.email, diagramaSeleccionado);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("XXDocument data:", docSnap.data().data);
            const coleccion = user.email;
            const existe = true;
            navigate(`/diagrama/${diagramaSeleccionado}/${coleccion}/${existe}`);
        } else {
            console.log("No such document!");
        }
    }

    const handleNavigationToDiagramaExistente = () => {
        console.log("Diagrama seleccionado:", diagramaSeleccionado);
        obtenerDocDeDiagramaSeleccionado();
    }

    const handleNavigationToDiagramaTerceros = () => {
        console.log("Diagrama seleccionado:", diagramaSeleccionado);
        const existe = true;
        navigate(`/diagrama/${diagramaTercero}/${userTercero}/${existe}`);
    }

    const handleNavigationToNewDiagrama = () => {
        if (!user) return;
        crearDiagrama(nombreNuevoDiagrama, diagrams, user.email);
        const coleccion = user.email;
        const existe = false;
        navigate(`/diagrama/${nombreNuevoDiagrama}/${coleccion}/${existe}`);
    }

    return (
        <div className="container">
            <h1>Bienvenido, {user ? user.email : 'Usuario'}</h1>
            {/* Acontinuacion un texto que explica que puede crear un nuevo proyecto o unirse a uno existente */}
            <p>Seleccione una de las siguientes opciones:</p>

            <div className="section">
                <div className="section-header">
                    <label>Crear Nuevo Proyecto:</label>
                </div>
                <input
                    className="input-field"
                    type="text"
                    value={nombreNuevoDiagrama}
                    onChange={e => setNombreNuevoDiagrama(e.target.value)}
                    placeholder="Nombre del nuevo proyecto"
                />
                <button className="primary-button" onClick={() => handleNavigationToNewDiagrama()}>
                    Crear Proyecto
                </button>
            </div>

            <hr className="divider" />

            <div className="section">
                <div className="section-header">
                    <label>Mis Proyectos</label>
                </div>
                <select
                    className="select-field"
                    onChange={e => setDiagramaSeleccionado(e.target.value)}>
                    <option value="">Selecciona un proyecto</option>
                    {diagrams.map(diagram => (
                        <option key={diagram.id} value={diagram.id}>
                            {diagram.id}
                        </option>
                    ))}
                </select>
                <button className="secondary-button" onClick={() => handleNavigationToDiagramaExistente()}>
                    Continuar Editando
                </button>
            </div>

            <div className="section">
                <div className="section-header">
                    <label>Unirme A Otro Proyecto:</label>
                </div>
                <input
                    className="input-field"
                    type="text"
                    value={userTercero}
                    onChange={e => setUserTercero(e.target.value)}
                    placeholder="User del usuario"
                />
                <input
                    className="input-field"
                    type="text"
                    value={diagramaTercero}
                    onChange={e => setDiagramaTercero(e.target.value)}
                    placeholder="Nombre del proyecto a editar"
                />
                <button className="primary-button" onClick={() => handleNavigationToDiagramaTerceros()}>
                    Unirse a Proyecto
                </button>
            </div>
        </div>
    );
}