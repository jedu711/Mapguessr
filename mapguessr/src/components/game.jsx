import * as React from 'react';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Link from '@mui/material/Link';
import { ThemeProvider } from '@emotion/react';
import Button from '@mui/material/Button';
import CountUp from 'react-countup';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';


const marks = [
    {
        value: -1000,
        label: '1000 BCE'
    },
    { value: -900 }, { value: -800 }, { value: -700 }, { value: -600 },
    {
        value: -500,
        label: '500 BCE'
    },
    { value: -400 }, { value: -300 }, { value: -200 }, { value: -100 },
    {
        value: 1,
        label: '1 CE'
    }, { value: 100 }, { value: 200 }, { value: 300 }, { value: 400 },
    {
        value: 500,
        label: '500 CE'
    },
    { value: 600 }, { value: 700 }, { value: 800 }, { value: 900 },
    {
        value: 1000,
        label: '1000 CE'
    },
    { value: 1100 }, { value: 1200 }, { value: 1300 }, { value: 1400 },
    {
        value: 1500,
        label: '1500 CE'
    },
    { value: 1600 }, { value: 1700 }, { value: 1800 }, { value: 1900 },
    {
        value: 2000,
        label: '2000 CE'
    },
];

function valueText(value) {
    if (value < 0) {
        return Math.abs(value) + ' BCE'
    }
    else if (value > 0) {
        return value + ' CE'
    }
}

function animDisplay(value, reset) {
    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
        setDisplayValue(0)

        const end = Math.abs(value)
        let current = 0;
        const increment = end / 60;

        const timer = setInterval(() => {
            current += increment;
            
            if (current >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            }
            else {
                setDisplayValue(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, reset])

    return displayValue;
}

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  borderBottom: `1px solid rgb(60, 60, 80)`,
  '&::before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem', color: 'white' }} />}
    {...props}
  />
))
(({ theme }) => ({
    backgroundColor: 'rgb(26, 27, 39)',
    flexDirection: 'row-reverse',
    color: 'white',
    fontWeight: 'bold',
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
        {
        transform: 'rotate(90deg)',
        color: 'white',
        },
    [`& .${accordionSummaryClasses.content}`]: {
        marginLeft: theme.spacing(1),
    },
    ...theme.applyStyles('dark', {
        backgroundColor: 'rgb(23, 24, 34)',
    }),
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgb(60, 60, 80)',
  backgroundColor: 'rgb(23, 24, 34)',
  color: 'white',
}));

function Game() {
    // game variables
    const [guess, setValue] = React.useState(1);
    const [round, SetRound] = React.useState(1);
    const [score, SetScore] = React.useState(0);
    const [targets, SetTargets] = React.useState([]);
    const [images, SetImages] = React.useState([]);
    const [descs, SetDescs] = React.useState([]);
    const [hasGuessed, SetHasGuessed] = React.useState(false);
    const [dataLoaded, SetDataLoaded] = React.useState(false);
    const [points, SetPoints] = React.useState(0);

    const today = new Date().toLocaleDateString('en-CA');

    console.log("current date: " + today);

    // display variables
    const displayYear = animDisplay(targets[round - 1], hasGuessed);
    const displayPoints = animDisplay(points, hasGuessed);

    // game state variables
    const [gameOver, SetGameOver] = React.useState(false);
    const [loadState, SetLoadState] = React.useState(true);

    // idek bro
    const [expanded, setExpanded] = React.useState('panel1');

    const handleChange = (panel) => (event, newExpanded) => {
        setExpanded(newExpanded ? panel : false);
    };

    React.useEffect(() => {
        const init = async () => {
            const gameState = await fetchGameState();
            const currRound = gameState ? gameState.round : 1;

            await fetchRounds(currRound);
            SetLoadState(false);
        }
        init();
    }, []);

    const handleSliderChange = (event, newValue) => {
        setValue(newValue);
    };

    const saveGameState = async (round, total_score, score) => {
        const res = await fetch('http://localhost:3001/api/savestate/' + round + '?date=' + today + '&total_score=' + total_score 
            + '&score=' + score, { method: 'POST', credentials: 'include' });
        const data = await res.json();

        if (data.status === 1) {
            console.log("failed to save gamestate");
        }
    }

    const fetchGameState = async() => {
        const res = await fetch('http://localhost:3001/api/gamestate/' + today, { credentials: 'include' });
        const data = await res.json();

        if (data.status === 2) {
            return null;
        }

        SetRound(data.round)
        SetScore(data.score)
        SetGameOver(data.completed)

        return data;
    }

    const fetchRounds = async (round) => {
        try {
            const data = await Promise.all(
                [1,2,3,4,5].map(roundNum =>
                    fetch('http://localhost:3001/api/round/' + roundNum + '?date=' + today, {
                        credentials: 'include'
                    }).then(res => res.json())
                )
            );

            SetTargets(data.map(d => d.year));
            SetImages(data.map(d => d.map));
            SetDescs(data.map(d => d.desc));
            SetDataLoaded(true);
        }
        catch (err) {
            console.error(err);
        }
    };

    const handleGuess = () => {
        const diff = Math.abs(targets[round - 1] - guess)
        
        const roundScore = 1000 - Math.max(0, Math.min(1000, diff))
        
        SetPoints(roundScore);
        SetScore(score + roundScore);
        SetHasGuessed(true);

        saveGameState(round, score + roundScore, roundScore);
    };

    const handleContinue = async () => {
        const nextRound = round + 1;

        if (round === 5) {
            SetGameOver(true);
            return;
        }
        
        SetHasGuessed(false);
        SetRound(nextRound);
    };

    if (loadState) {
        return <></>;
    }
    else if (!gameOver) {
        return (
            <>
                <section>
                    <div>
                        <div style={{ 
                            display: 'flex',
                            width: "1919px",
                            height: "50px",
                            backgroundColor: "rgb(17, 17, 23)",
                            alignItems: 'left'
                            }}>
                                <Link href='/' color='inherit' underline='hover'> MapGuessr </Link>
                        </div>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '6.5%',
                        left: '0.5%',
                    }}>
                        <h2> {round}/5 </h2>
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '6.5%',
                        right: '0.5%',
                    }}>
                        <h2> {score} </h2>
                    </div>
                    <div style={{ height: '60px' }}>
                        <h1> {valueText(guess)} </h1>
                    </div>
                    <div>
                        <Box sx={{ width: 1720, mx: 'auto' }}>
                            
                            <Slider
                                defaultValue={1}
                                min={-1000}
                                max={2026}
                                marks = {marks}
                                onChange={handleSliderChange}
                                disabled={hasGuessed}
                                sx={{
                                    '& .MuiSlider-markLabel': { color: 'white' }
                                }}
                            />
                        </Box>
                    </div>
                    <div style={{display: "flex", justifyContent: "center"}}>
                        <div style={{ position: 'relative' }}>
                            <TransformWrapper>
                                <TransformComponent>
                                    {dataLoaded && images[round - 1] && (
                                        <img key={images[round - 1]} src={images[round - 1]} height="700"/>
                                    )}
                                </TransformComponent>
                            </TransformWrapper>
                            {hasGuessed && (
                                <div 
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        width: "430px",
                                        height: "583px",
                                        backgroundColor: "rgb(26, 27, 39, 0.8)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: '200px'
                                    }}
                                >
                                    <p>{descs[round - 1]}</p>
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                top: '85%',
                                width: "1265px",
                                height: "120px",
                                backgroundColor: "rgb(26, 27, 39, 0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "8px",
                                gap: '200px'
                            }}
                        >
                            { !hasGuessed ?    
                                (<Button 
                                    variant='contained' 
                                    color='success' 
                                    size='large' 
                                    onClick={handleGuess}> 

                                    Guess 
                                </Button>) : 
                                (<>
                                    <div style={{position: 'fixed', left: "30%"}}>
                                        <h2>
                                            {targets[round - 1] < 0 ? displayYear + ' BCE' : targets[round - 1] > 0 ? displayYear + ' CE' : displayYear}
                                        </h2>
                                    </div>
                                    <Button 
                                        variant='contained' 
                                        color='success' 
                                        size='large' 
                                        onClick={handleContinue}> 
                                            
                                        Continue 
                                    </Button>
                                    <div style={{position: 'fixed', right: "30%"}}>
                                        <h2 style={{ width: '50px' }}>
                                            {displayPoints}
                                        </h2>
                                    </div>
                                </>) 
                            }
                        </div>
                    </div>
                </section>
            </>
        );
    }
    else {
        return (
        <>
            <section>
                <div>
                    <div style={{ 
                        display: 'flex',
                        width: "1919px",
                        height: "50px",
                        backgroundColor: "rgb(17, 17, 23)",
                        alignItems: 'left'
                        }}>
                            <Link href='/' color='inherit' underline='hover'> MapGuessr </Link>
                    </div>
                </div>
                <h1> RESULTS </h1>
                <h2> {score} </h2>
                
                <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                    <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography component="span"><strong>Round 1</strong></Typography>
                            <Typography component="span"><strong>{score}</strong></Typography>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: "flex" }}>
                            <div style={{ paddingRight: "10px" }}>
                                <TransformWrapper>
                                    <TransformComponent>
                                        {dataLoaded && images[0] && (
                                            <img key={images[0]} src={images[0]} width="900"/>
                                        )}
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                            <div style={{ justifyItems: 'left' }}>
                                <Typography><strong>score: </strong></Typography>
                                <Typography><strong>map year: </strong> {targets[0]} </Typography>
                                <Typography><strong>your guess: </strong></Typography>
                                <Typography><strong>difference: </strong></Typography>
                                <div style={{ justifyItems: 'center', padding: '40px' }}>
                                    <Typography> </Typography>
                                </div>
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary aria-controls="panel2d-content" id="panel2d-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography component="span"><strong>Round 2</strong></Typography>
                            <Typography component="span"><strong>{score}</strong></Typography>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: "flex" }}>
                            <div style={{ paddingRight: "10px" }}>
                                <TransformWrapper>
                                    <TransformComponent>
                                        {dataLoaded && images[1] && (
                                            <img key={images[1]} src={images[1]} width="900"/>
                                        )}
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                            <div style={{ justifyItems: 'left' }}>
                                <Typography><strong>score: </strong></Typography>
                                <Typography><strong>map year: </strong> {targets[1]} </Typography>
                                <Typography><strong>your guess: </strong></Typography>
                                <Typography><strong>difference: </strong></Typography>
                                <div style={{ justifyItems: 'center', padding: '40px' }}>
                                    <Typography> </Typography>
                                </div>
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                    <AccordionSummary aria-controls="panel3d-content" id="panel3d-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography component="span"><strong>Round 3</strong></Typography>
                            <Typography component="span"><strong>{score}</strong></Typography>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: "flex" }}>
                            <div style={{ paddingRight: "10px" }}>
                                <TransformWrapper>
                                    <TransformComponent>
                                        {dataLoaded && images[2] && (
                                            <img key={images[2]} src={images[2]} width="900"/>
                                        )}
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                            <div style={{ justifyItems: 'left' }}>
                                <Typography><strong>score: </strong></Typography>
                                <Typography><strong>map year: </strong> {targets[2]} </Typography>
                                <Typography><strong>your guess: </strong></Typography>
                                <Typography><strong>difference: </strong></Typography>
                                <div style={{ justifyItems: 'center', padding: '40px' }}>
                                    <Typography> </Typography>
                                </div>
                            </div>
                        </div>
                        <Typography>
                            
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                    <AccordionSummary aria-controls="panel4d-content" id="panel4d-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography component="span"><strong>Round 4</strong></Typography>
                            <Typography component="span"><strong>{score}</strong></Typography>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: "flex" }}>
                            <div style={{ paddingRight: "10px" }}>
                                <TransformWrapper>
                                    <TransformComponent>
                                        {dataLoaded && images[3] && (
                                            <img key={images[3]} src={images[3]} width="900"/>
                                        )}
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                            <div style={{ justifyItems: 'left' }}>
                                <Typography><strong>score: </strong></Typography>
                                <Typography><strong>map year: </strong> {targets[3]} </Typography>
                                <Typography><strong>your guess: </strong></Typography>
                                <Typography><strong>difference: </strong></Typography>
                                <div style={{ justifyItems: 'center', padding: '40px' }}>
                                    <Typography> </Typography>
                                </div>
                            </div>
                        </div>
                        <Typography>
                            
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
                    <AccordionSummary aria-controls="panel5d-content" id="panel5d-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography component="span"><strong>Round 5</strong></Typography>
                            <Typography component="span"><strong>{score}</strong></Typography>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: "flex" }}>
                            <div style={{ paddingRight: "10px" }}>
                                <TransformWrapper>
                                    <TransformComponent>
                                        {dataLoaded && images[4] && (
                                            <img key={images[4]} src={images[4]} width="900"/>
                                        )}
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                            <div style={{ justifyItems: 'left' }}>
                                <Typography><strong>score: </strong></Typography>
                                <Typography><strong>map year: </strong> {targets[4]} </Typography>
                                <Typography><strong>your guess: </strong></Typography>
                                <Typography><strong>difference: </strong></Typography>
                                <div style={{ justifyItems: 'center', padding: '40px' }}>
                                    <Typography> </Typography>
                                </div>
                            </div>
                        </div>
                        <Typography>
                            
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </section>
        </>
        );
    }
}

export default Game;