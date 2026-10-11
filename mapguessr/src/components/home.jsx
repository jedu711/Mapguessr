import { useNavigate } from "react-router";
import React from 'react';

function Home() {
    const nav = useNavigate()

    const navigate= ()=>{
        nav('/game?today')
    }

    React.useEffect(() => {

        fetch('http://localhost:3001/api/init', {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            console.log("User initialized:", data.uid);
        })
        .catch(err => console.error(err));
    }, []);

    return (
    <>
      <section id='center-top'>
        <div>
          <h1> MapGuessr </h1>
        </div>
        <button
          className = "counter"
          onClick={navigate}
          >
            Start Today
        </button>
      </section>
    </>
    )
}

export default Home;