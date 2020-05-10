/*************************************************/

let generate = idCatch("generate");
let main = idCatch("main");
let mapContainer = idCatch("map-container");
let gLine = idCatch("g-line");

/*Global variable that serves the purpose of monitoring when the
button "generate" is clicked. When that happens, it is set 
to false, which means that the user will not be able to click on
"generate" while the new map is being made*/
let control = true;
let goClouds = true;

generate.addEventListener("click", () => {
	if (control) {
		generate.style.opacity = 0;
		control = false;
		goClouds = false;
		mapContainer.removeChild(idCatch("main-container"));
		loader(gLine, -115, -15, 3, mapContainer.firstElementChild);
	}
});

/*Inside of this function is a mechanism that
allows elegant feel to the process of new map generation.
It is executed from the event on "generate" button*/
function loader(x, startingPoint, endPoint, speed, container) {

	let loadMoment = startingPoint + (Math.round(Math.random()*29) + 1)*3;
	x.style.left = startingPoint + "px";
	requestAnimationFrame(() => {
		move(x, loadMoment);
	});

	function move(x, loadMoment) {
		if (control == false) {
			if (parseInt(x.style.left) > endPoint) {
				control = true;
				idCatch("main-container").style.display = "block";
				container.style.opacity = 0;
				generate.style.opacity = 1;
			} else {
				if (container.style.opacity == 0) {
					container.style.opacity = 1;
				}
				if(parseInt(x.style.left) == loadMoment) {
					goClouds = true;
					mapGenerator("none");
				}
				x.style.left = parseInt(x.style.left) + speed + "px";
				requestAnimationFrame(() => {
					move(x, loadMoment);
				});
			}
		}
	}
}

/*In this global object, we are storing relevant information about the map. 
	These are all 2D arrays, representing a map in grid form.*/
let grid = {
	binary: [],
	style: [],
	main: [],
	behind: [],
	citiesAndRoad: []
};
/*grid.binary holds 1 or 0 as values of elements. 1 represents
a place on map where the land is, while 0 represents the water.*/

/*grid.style holds basic information in grid form about 
colors of divs that represent the map. "G", "Y" and "~".*/

/*grid.main holds main divs that make up a map.*/

/*grid.behid stores background divs used for solving some
problems related to the styling of the map.*/

/*grid.cities holds information about locations of cities
in a grid. Value of 1 if a city is there, 0 for othe cases.*/

/*Height of one standard map box.*/
let boxHeight = 90;

/*These global variables determen the size of the map.*/
let rowNum = 6;
let colNum = 14;
mapContainer.style.height = boxHeight*rowNum + "px";
mapContainer.style.width = boxHeight*colNum + "px";

/*Calling of the main function*/
mapGenerator("block");

//=============================================================//

/*Main function*/
function mapGenerator(initialDisplay) {

	/*mainContainer is a div that will contain the entire map.*/
	let mainContainer = boxCreation(mapContainer);
	mainContainer.style.height = boxHeight*rowNum + "px";
	mainContainer.style.width = boxHeight*colNum + "px";
	mainContainer.setAttribute("id", "main-container");
	mainContainer.style.top = 0;
	mainContainer.style.left = 0;
	mainContainer.style.overflow = "hidden";
	mainContainer.style.zIndex = 0;
	mainContainer.style.display = initialDisplay;

	/*Initialization of 2D arrays.*/
	twoDimesionalSeqInit(grid.binary, 0, rowNum, colNum);
	twoDimesionalSeqInit(grid.main, null, rowNum, colNum);
	twoDimesionalSeqInit(grid.behind, null, rowNum, colNum);
	twoDimesionalSeqInit(grid.style, "~", rowNum, colNum);
	twoDimesionalSeqInit(grid.citiesAndRoad, 0, rowNum, colNum);

	lastOne = -1;

	/*Variable x represents the number of boxes that represent
	landmass. The rest are used for water divs.*/
	let x = 50;
	for(let i = 0; i < x; i++) {
		boxesCreation(boxHeight, mainContainer);
	}
	//boxesCreation(boxHeight, mainContainer);
	oceanCreator(idCatch("main-container"));
	backgroundDivsCreation(grid.behind, mainContainer, boxHeight);

	/*Moving through the grid and scanning for corners to be rounded.*/
	for(let i = 0; i < rowNum; i++) {
		for(let j = 0; j < colNum; j++) {
			cornerMaker(i, j);
		}
	}

	//Adding wave-like animation to the water boxes
	for (let i = 0; i < colNum; i++) {
		waterScan(grid.style, i,  mainContainer, boxHeight);
	}

	/********************************************************************/

	/*Creating and inserting two cities*/
	let twoCities = [];
	{
		let c1 = 0;
		let c2 = 0;

		do {
			c1 = Math.round(Math.random()*(rowNum - 1));
			c2 = Math.round(Math.random()*(colNum/2 - 1));
		} while (grid.style[c1][c2] == "~" || grid.style[c1][c2] == "Y");

		grid.style[c1][c2] = "C";
		twoCities[0] = [c1, c2];
		grid.citiesAndRoad[c1][c2] = "r";

		let bottom = 20;
		for(let o = 0; o < 30; o++) {
			if(o%6 == 0) {
				bottom += 10;
			}
			buildingsCreator(grid.main[c1][c2], bottom);
		}
		skyscraper(grid.main[c1][c2], 80, 30, 96, 70, Math.round(Math.random()*20) + 20);

		do {
			c1 = Math.round(Math.random()*5);
			c2 = Math.round(Math.random()*(colNum/2 - 1) + 7);
		} while (grid.style[c1][c2] == "~" || grid.style[c1][c2] == "Y");

		grid.style[c1][c2] = "C";
		grid.citiesAndRoad[c1][c2] = "r";
		twoCities[1] = [c1, c2];

		bottom = 20;
		for(let o = 0; o < 30; o++) {
			if(o%6 == 0) {
				bottom += 10;
			}
			buildingsCreator(grid.main[c1][c2], bottom);
		}
		skyscraper(grid.main[c1][c2], 80, 30, 96, 70, Math.round(Math.random()*20) + 20);
	}

	/********************************************************************/

	/*This first part takes in the coordinates of the first city and scans 
	every land div around him to see if they connect. Connections are checked 
	only "straight", not diagonally, because of the nature of our future road. 
	Then those connections, if they exist, are pushed into an array, and are 
	checked themselves for the same thing. This way, when it is all done, we 
	get the info that tells us if there is the ground connection between the 
	two cities. And we get nice grid representation of the land surrounding 
	our first city. Then we do the same for the second city if there is no 
	initial ground connection. If we find that some point from the first city 
	surroundings is one div away from the second city surroundings point, then
	 we join those two land masses and that water div, which is a place for a 
	 bridge.*/

	let roadMap = [];
	twoDimesionalSeqInit(roadMap, ".", rowNum, colNum);
	let roadLandMass = groundConnection([twoCities[0][0],twoCities[0][1]], roadMap);

	for(let j = 1; j < roadLandMass.length; j++) {
		roadMap[roadLandMass[j][0]][roadLandMass[j][1]] = "#";
	}

	let teritorialConnection = false;

	if(roadMap[twoCities[1][0]][twoCities[1][1]] == "#") {
		teritorialConnection = true;
	} else {
		teritorialConnection = false;
		let u = groundConnection([twoCities[1][0], twoCities[1][1]], roadMap);
		for(let j = 1; j < u.length; j++) {
			roadMap[u[j][0]][u[j][1]] = "#";
		}
		roadMap[u[0][0]][u[0][1]] = "C";

		let bridgePoint = [];
		for(let i = 0; i < roadLandMass.length; i++) {
			let end = false;
			for(let j = 0; j < u.length; j++) {
				if (roadLandMass[i][0] == u[j][0] && (u[j][1] + 2) == roadLandMass[i][1]) {
					bridgePoint = [roadLandMass[i][0], roadLandMass[i][1] - 1];
					end = true;
					break;
				} else if (roadLandMass[i][0] == u[j][0] && (u[j][1] - 2) == roadLandMass[i][1]) {
					bridgePoint = [roadLandMass[i][0], roadLandMass[i][1] + 1];
					end = true;
					break;
				} else if (roadLandMass[i][1] == u[j][1] && (u[j][0] + 2) == roadLandMass[i][0]) {
					bridgePoint = [roadLandMass[i][0] - 1, roadLandMass[i][1]];
					end = true;
					break;
				} else if (roadLandMass[i][1] == u[j][1] && (u[j][0] - 2) == roadLandMass[i][0]) {
					bridgePoint = [roadLandMass[i][0] + 1, roadLandMass[i][1]];
					end = true;
					break;
				}
			}

			if (end == true) {

				teritorialConnection = true;
				for(let j = 0; j < u.length; j++) {
					roadLandMass.push(u[j]);
				}
				roadLandMass.push(bridgePoint);
				grid.style[bridgePoint[0]][bridgePoint[1]] = "B";
				break;
			}
		}
	}


	/********************************************************************/
	/*We iterate over the surroundings we got from the previous part. We 
	start from the point that represents the first city. We then scan its 
	souroundings randomly(random walk) and keep results in an array. We do 
	this in a for loop that runs 20 times. Then, if that new array has the 
	second city as a point, that array is saved in a global one called 
	mainArr. We repeat this process many times and then simply take the best 
	estimate, which is an array with the smallest length.*/

	let mainArr = [];
	if(teritorialConnection) {
		for(let k = 0; k < 10000; k++) {

			let lastEl = roadLandMass[0];
			let arr = [];
			arr.push(lastEl);
			let loopCounter = 0;
			let temp = [];

			let found = false;
			let samePoint = false;

			do {
				let pointsAround = surroundings(lastEl[0], lastEl[1], grid.style);
				if(pointsAround.length != 0) {
					temp = pointsAround[Math.round(Math.random()*(pointsAround.length - 1))];
					samePoint = false;
					for(let i = 0; i < arr.length; i++) {
						
						if(temp[0] == arr[i][0] && temp[1] == arr[i][1]) {
							samePoint = true;
							break;
						}
						if(temp[0] == twoCities[1][0] && temp[1] == twoCities[1][1]) {
							found = true;
						}
					}
				}

				if(samePoint == false) {
					arr.push(temp);
				} 

				lastEl = arr[arr.length - 1];
				loopCounter++;

			} while(found == false && loopCounter < 30);

			if (found == true) {
				mainArr.push(arr);
			}

		}
	}

	/*In route[] we put the element of smallest length from mainArr[],
	and then we proceed to build a road with that information.*/
	let route = [];
	if(mainArr.length > 0) {
		route = mainArr[smallestArr(mainArr)];
	}

	/*==================================================================*/

	/*Invoking the "road-buildin" functions*/
	for(let i = 0; i < route.length; i++) {
		if(i == 0) {
			begOrEnd(route[i], route[i+1], grid.main[route[i][0]][route[i][1]], 12, boxHeight);
		} else if(i == route.length - 1) {
			begOrEnd(route[i], route[i-1], grid.main[route[i][0]][route[i][1]], 12, boxHeight);
		} else {
			roadMaker(grid.main[route[i][0]][route[i][1]], route[i], route[i+1], 12, route[i-1], 3);
			roadMaker(grid.main[route[i][0]][route[i][1]], route[i], route[i-1], 12, route[i+1], 3);
			grid.citiesAndRoad[route[i][0]][route[i][1]] = "r";
		}
	}
	/*==================================================================*/

	/*Generating textures...*/

	for(let i = 0; i < rowNum; i++) {
		for(let j = 0; j < colNum; j++) {
			/*Inserting Ships*/
			if(grid.style[i][j] == "~") {
				if(Math.round(Math.random()*4) == 2) { 
					ship(grid.main[i][j]);
				}
			}
			if(grid.style[i][j] == "Y" && grid.citiesAndRoad[i][j] != "r") {
				
				/*Generating textures*/
				let v = Math.round(Math.random()*3) + 3;
				for(let o = 0; o < v; o++) {
					duneCreator(grid.main[i][j]);
				}
			}
			
			/*Inserting Crops and Hills*/
			if (grid.style[i][j] == "G" && grid.citiesAndRoad[i][j] != "r") {
				if(Math.round(Math.random()*4) == 2) {
					cropsCreator(grid.main[i][j], boxHeight);
				} else if(Math.round(Math.random()*4) == 2) {
					let hilsNum = Math.round(Math.random()*2) + 1;
					for(let o = 0; o < hilsNum; o++) {
						hillsCreator(grid.main[i][j]);
					}
				}
			}
		}
	}

	/*==================================================================*/

	//Adding clouds to the map
	createCloud("cloud", Math.round(Math.random()*colNum*boxHeight), mainContainer);
	createCloud("cloud2", Math.round(Math.random()*colNum*boxHeight), mainContainer);
	createCloud("cloud3", Math.round(Math.random()*colNum*boxHeight), mainContainer);
	createCloud("cloud4", Math.round(Math.random()*colNum*boxHeight), mainContainer);
	weather(idCatch("cloud"), 1);
	weather(idCatch("cloud2"), 2);
	weather(idCatch("cloud3"), 2);
	weather(idCatch("cloud4"), 1);
}

//================================================================//

/*A function that creates boxes with Green and Yellow colors*/
function boxesCreation(boxHeight, mainContainer) {

	let el = boxCreation(mainContainer);
	let a = nearestBoxCoordinates();		
	let topNew = a[0];
	let leftNew = a[1];

	/*Check to see if nearestBoxCoordinates() numbers are within bounds and
	are not both equal to zero. lastOne represents the last created box and is
	initialy set to -1. We need that information because boxes are generated to 
	be continuous mass of land. If that is not possible, randomGridNums() is invoked,
	and that approach actually leads to better shapes of land.*/
	if(lastOne != -1) {
		while (((topNew == 0) && (leftNew == 0)) ||
			((parseInt(lastOne.style.top)/boxHeight + topNew > rowNum - 1) || 
				(parseInt(lastOne.style.left)/boxHeight + leftNew > colNum - 1) )
			|| ((parseInt(lastOne.style.top)/boxHeight + topNew < 0) || 
				(parseInt(lastOne.style.left)/boxHeight + leftNew < 0) )) 
		{
			a = nearestBoxCoordinates();		
			topNew = a[0];
			leftNew = a[1];
		}

		topNew += parseInt(lastOne.style.top)/boxHeight;
		leftNew += parseInt(lastOne.style.left)/boxHeight;

	} else {
		topNew += (Math.round(Math.random()*(rowNum - 1)));
		leftNew += (Math.round(Math.random()*(colNum - 1)));
	}

	do {
		let z = randomGridNums();
		leftNew = z[0];
		topNew = z[1];
	} while (grid.binary[topNew][leftNew] == 1)

	/*Practically utilizing newly-found free position for our box.*/
	el.style.top = topNew * boxHeight + "px";
	el.style.left = leftNew * boxHeight + "px";

	/*Passing of information to the grids*/
	grid.binary[topNew][leftNew] = 1;
	grid.main[topNew][leftNew] = el;
	lastOne = grid.main[topNew][leftNew];

	/*There is one in four chance that the Yellow box will be
	created instead of Green box. Cities, hills, grass, and dunes
	 are inserted here.*/
	if (Math.round(Math.random()*3) == 0){
		el.style.backgroundColor = "yellow";
	} else {
		el.style.backgroundColor = "green";
		/*Inserting Grass*/
		grass(el);
	}

	grid.style[topNew][leftNew] = 
		el.style.backgroundColor.slice()[0].toUpperCase();
}

//================================================================//

/*A function that creates boxes with blue color, representing the 
water. That is done after the Green and Yellow divs are created. 
grid.binary is being used here, to perform a check on it. 
0 represents the place where water should be.*/
function oceanCreator(mainContainer) {
	f = true;
	for(let i = 0; i < rowNum; i++) {
		for(let j = 0; j < colNum; j++) {
			if (grid.binary[i][j] == 0) {
				let el = boxCreation(mainContainer);
				el.style.margin = "0px";
				el.style.top = i * boxHeight + "px";
				el.style.left = j * boxHeight + "px";
				el.style.backgroundColor = "blue";
				grid.main[i][j] = el;
			}
		}
	}
}

/*A function that creates a div with a width of two times smaller
 that a standard box, but with the same height. They are placed in
  grid.behind, to address the problem that arises when a corner of 
  a box is given border-radius. The background color of the container is then 
  uncovered in a small place where a straight corner used to be. 
  This solves the problem, because I only made corners where three 
  boxes that form it are of the same color. So, then I would just 
  give the same background color to that back div. The reason that 
  there is two of them is to address the problem of two rounded 
  corners of the same box on an opposite sides with different colors.*/
function smallerBoxCreation(mainContainer) {
	let newEl = createElement("div", mainContainer);
	newEl.style.position = "absolute";
	newEl.style.height = boxHeight + "px";
	newEl.style.width = boxHeight/2 + "px";
	return newEl;
}

/*A function that creates background divs for all boxes.*/
function backgroundDivsCreation(grid, mainContainer, boxHeight) {

	for(let i = 0; i < rowNum; i++) {
		for(let j = 0; j < colNum; j++) {

			let el = smallerBoxCreation(mainContainer);
			el.style.top = i * boxHeight + "px";
			el.style.left = j * boxHeight + "px";
			el.style.zIndex = -1;

			let e = smallerBoxCreation(mainContainer);
			e.style.top = i * boxHeight + "px";
			e.style.left = j * boxHeight + (boxHeight/2) + "px";
			e.style.zIndex = -1;

			grid[i][j] = [el, e];
		}
	}
}

/*Exactly what you would think: a function that generates grass. 
It is of an environmental-friendly type*/
function grass(el) {

	for(let i = 0; i < 40; i++) {
		let p = document.createElement("div");
		el.appendChild(p);
		p.style.position = "absolute";
		p.style.height = Math.random()*5 + 1 + "px";
		p.style.width = Math.random()*5 + 1 + "px";
		p.style.backgroundColor = "darkgreen";
		p.style.top = Math.random()*90 + "%";
		p.style.left = Math.random()*90 + "%";
	}
}

//================================================================//

/*The reason this function is called  boxSuroundings is because it returns
a sequence that represents all boxes surrounding a box we are looking at. 
I ended up not using it.*/
function boxSuroundings(grid) {

	let corners = [];
	for(let i = 0; i < rowNum; i++) {
		for(let j = 0; j < colNum; j++) {

			let seq = [];
			let counter = 0;
			let start = i > 0 ? i - 1 : i;
			let end = (i != 7) ? i + 1 : i;
			let start2 = j > 0 ? j - 1 : j;
			let end2 = (j != 7) ? j + 1 : j;

			for(let m = start; m <= end; m++) {

				for(let k = start2; k <= end2; k++) {

					if ((m == i) && (k == j)) {
						seq[counter] = "#";
						counter++;
					} else {
						seq[counter] = grid[m][k];
						counter++;
					}
				}
			}
			corners.push(seq);
		}
	}
	return corners;
}

/*A function that looks at corners of a box we are invoking it on. 
If it finds that the two boxes next to the corner box are of same 
color, that the corner of a box that we are looking at is given a 
certain border-radius.*/
function cornerMaker(n, m) {

	//Corner topRight
	if (!(n-1 < 0 || m+1 > colNum - 1)) {
		if ( (grid.style[n-1][m+1] != grid.style[n][m]) &&
		(grid.style[n-1][m+1] == grid.style[n-1][m]) &&
		(grid.style[n-1][m+1] == grid.style[n][m+1]) )
		{
			let radiusFactor = Math.random()*20 + 15;
			grid.main[n][m].style.borderTopRightRadius = 
				radiusFactor + "px";
			grid.behind[n][m][1].style.backgroundColor = 
				grid.main[n-1][m+1].style.backgroundColor;
		}
	}

	//Corner topLeft
	if (!(n-1 < 0 || m-1 < 0)) {
		if ( (grid.style[n-1][m-1] != grid.style[n][m]) &&
		(grid.style[n-1][m-1] == grid.style[n-1][m]) &&
		(grid.style[n-1][m-1] == grid.style[n][m-1]) ) 
		{
			let radiusFactor = Math.random()*20 + 15;
			grid.main[n][m].style.borderTopLeftRadius = 
				radiusFactor + "px";
			grid.behind[n][m][0].style.backgroundColor = 
				grid.main[n-1][m-1].style.backgroundColor;
		}
	}

	//Corner bottomLeft
	if (!(n+1 > rowNum - 1 || m-1 < 0)) {
		if ( (grid.style[n+1][m-1] != grid.style[n][m]) &&
			(grid.style[n+1][m-1] == grid.style[n][m-1]) &&
			(grid.style[n+1][m-1] == grid.style[n+1][m]) ) 
		{
			let radiusFactor = Math.random()*20 + 15;
			grid.main[n][m].style.borderBottomLeftRadius = 
				radiusFactor + "px";				
			grid.behind[n][m][0].style.backgroundColor = 
				grid.main[n+1][m-1].style.backgroundColor;
		}
	}

	//Corner bottomRight
	if (!(n+1 > rowNum - 1 || m+1 > colNum - 1)) {
		if ( (grid.style[n+1][m+1] != grid.style[n][m]) &&
			(grid.style[n+1][m+1] == grid.style[n][m+1]) &&
			(grid.style[n+1][m+1] == grid.style[n+1][m]) ) 
		{
			let radiusFactor = Math.random()*20 + 15;
			grid.main[n][m].style.borderBottomRightRadius = 
				radiusFactor + "px";
			grid.behind[n][m][1].style.backgroundColor = 
				grid.main[n+1][m+1].style.backgroundColor;
		}
	}
}

//================================================================//

/*A function that basically chops water boxes in long thin divs 
which are used for wave animations. It does so by scanning the grid
 and finding continuous water divs and populating them with 
 many smaller ones.*/
function waterScan(grid, z, mainContainer, boxHeight) {
	let T = true;
	let c = 0;
	for (let i = 0; i < grid.length; i++) {
		if(grid[i][z] == "~") {
			c++;
		} else if (c == 0 && grid[i][z] != "~") {
			continue;
		} else if (c != 0 && grid[i][z] != "~") {
			T = false;
		}

		if ((T == false) || 
			((c != 0 && i == grid.length-1) && T == true)) {
			
			for (let j = 0; j < 6; j++) {
				let p = 0;
				if ((c != 0 && i == grid.length-1) && T == true) {
					p = 1;
				}

				let el = createElement("div", mainContainer);
				el.style.zIndex = 50;
				el.style.position = "absolute";
				el.style.width = boxHeight/6 + "px";
				el.style.top = (i - c + p) * boxHeight + "px";
				el.style.height = boxHeight*c + "px";
				el.style.left = j*boxHeight/6 + z*boxHeight + "px";
				el.style.backgroundColor = "rgb(0, 0, 255)";
				wave(el);
			}

			c = 0;
			T = true;
		}
	}
}

/*This one initiates the wave animation.*/
function wave(el) {

	let seq = [0, 0, 255];
	let seq2 = [0, 0, 255];
	requestAnimationFrame(() => {
			waterAnimation(el, seq2, seq);
		});
}

/*This function animates wave-like effect on water. It changes a color
of a box slightly, in a controlled random manner, messing with rgb()
value within bounds of +/-30 of the original value.*/
function waterAnimation(el, a, rgBlue) {
	let o = Math.round(Math.random()*2 + 1)*(-1)**(Math.round(Math.random()));

	if (a[0] + o > rgBlue[0] + 30) {
		o = 0;
	} else if (a[0] + o < rgBlue[0] - 30) {
		o = 0;
	} else {
		a[0] += o;
	}

	if (a[1] + o > rgBlue[1] + 30) {
		o = 0;
	} else if (a[1] + o < rgBlue[1] - 30) {
		o = 0;
	} else {
		a[1] += o;
	}

	if (a[2] + o > rgBlue[2] + 30) {
		o = 0;
	} else if (a[2] + o < rgBlue[2] - 30) {
		o = 0;
	} else {
		a[2] += o;
	}

	el.style.backgroundColor = "rgb(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
	if(goClouds) {
		requestAnimationFrame(() => {
			waterAnimation(el, a, rgBlue);
		});
	} else {
		return;
	}
}

//================================================================//

/*Next are self-explanatory functions that create simple
 textures for map*/

function duneCreator(parent) {
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.top = Math.round(Math.random()*65) + 5 + "%";
	el.style.left = Math.round(Math.random()*65) + 5 + "%";
	el.style.height = Math.round(Math.random()*10) + 15 + "px";
	el.style.width = Math.round(Math.random()*10) + 17 + "px";
	el.style.borderTop = "1px solid black";
	el.style.borderTopRightRadius = "50%";
	el.style.borderTopLeftRadius = "50%";
	el.style.backgroundColor = "yellow";
	el.style.zIndex = parseInt(el.style.top);
}

function buildingsCreator(parent, bottom) {
	let bColors = ["linear-gradient(to right, silver, #4c4c52)",
	"linear-gradient(to right, silver, #585888)",
	"linear-gradient(to right, silver, #404064)"];
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.bottom = bottom + "%";
	el.style.left = Math.round(Math.random()*65) + 10 + "%";
	el.style.height = Math.round(Math.random())*5 + 30 + "px";
	el.style.width = Math.round(Math.random())*5 + 15 + "px";
	el.style.backgroundColor = "grey";
	let index = Math.round(Math.random()*(bColors.length-1));
	el.style.background = bColors[index];
	el.style.zIndex = 200 - parseInt(el.style.bottom);
}

function hillsCreator(parent) {
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.top = Math.round(Math.random()*40) + 20 + "%";
	el.style.left = Math.round(Math.random()*40) + 5 + "%";
	el.style.height = Math.round(Math.random()*10) + 20 + "px";
	el.style.width = parseInt(el.style.height) + "px";
	el.style.borderLeft = "1px solid black";
	el.style.borderTop = "1px solid black";
	el.style.transform = "rotate(45deg)";
	el.style.background = "linear-gradient(to bottom right, white, green, green, green)";
	el.style.zIndex = parseInt(el.style.top);
}

function cropsCreator(parent, boxHeight) {
	let el = createElement("div", parent);
	let color = ["yellow", "red", "blue"];
	let bColor = ["silver", "salmon", "lightblue"];
	el.style.position = "absolute";
	el.style.top = Math.round(Math.random()*10) + 3 + "%";
	el.style.left = Math.round(Math.random()*10) + 5 + "%";
	el.style.height = "0px";
	el.style.width = "0px";
	let c = Math.round(Math.random()*(color.length - 1));
	if(Math.round(Math.random())) {
		el.style.transform = "rotate(90deg)";
		el.style.left = Math.round(Math.random()*20) + 60 + "px";
	}
	for(let i = 0; i < 30; i++) {
		individalCrop(el, 0 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c]);
	}
	for(let i = 0; i < 30; i++) {
		individalCrop(el, 10 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c] );
	}
	for(let i = 0; i < 30; i++) {
		individalCrop(el, 20 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c]);
	}
	for(let i = 0; i < 30; i++) {
		individalCrop(el, 30 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c]);
	}
	for(let i = 0; i < 30; i++) {
		individalCrop(el, 40 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c]);
	}
	if(Math.round(Math.random())) {
		for(let i = 0; i < 30; i++) {
			individalCrop(el, 50 + Math.round(Math.random()*3), i*1.5 + (boxHeight/10), color[c], bColor[c]);
		}
	}
}


function individalCrop(parent, top, left, color, c) {
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.top = top + "px";
	el.style.left = left + "px";
	el.style.height = Math.round(Math.random()*2) + 2 + "px";
	el.style.width = parseInt(el.style.height) + "px";
	el.style.borderRadius = "50%";
	el.style.backgroundColor = color;
	el.style.border = "1px solid " + c;
}

function ship(parent) {
	let el = createElement("div", parent);
	el.style.backgroundColor = "rgb(14, 19, 27)";
	el.style.zIndex = 51;
	el.style.border = "1px solid silver";
	el.style.position = "absolute";
	el.style.top = Math.round(Math.random()*80) + 5 + "%";
	el.style.left = Math.round(Math.random()*80) + 5 + "%";
	el.style.height = Math.round(Math.random()*5) + 4 + "px";
	el.style.width = Math.round(Math.random()*5) + 12 + "px";
	el.style.transform = "rotate(" + Math.round(Math.random()*360) + "deg)";
	el.style.borderRadius = Math.round(Math.random()*5) + 4 + "px";
}

function skyscraper(parent, h, w, childNum, level, left) {

	let p = document.createElement("div");

	p.style.position = "absolute";
    p.style.bottom = level + "%";
    p.style.left = left + "%";
    p.style.height = h + "px";
    p.style.width = w + "px";
    p.style.display = "flex";
    //p.style.border = "1px solid black";
    // p.style.backgroundColor = "#10153b";
    p.style.justifyContent = "space-between";
    p.style.alignItems = "center";
    p.style.flexWrap = "wrap";
    p.style.zIndex = 200 - parseInt(p.style.bottom);
    parent.appendChild(p);

    let bColors = ["linear-gradient(to right, silver, #4c4c52)",
	"linear-gradient(to right, silver, #585888)",
	"linear-gradient(to right, silver, #404064)"];
	
	let index = Math.round(Math.random()*(bColors.length-1));
	p.style.background = bColors[index];

    let m = [];

    for (let i = 0; i < childNum; i++){
    	m[i] = document.createElement("div");
    	m[i].style.height = 5 + "px";
    	m[i].style.width = 5 + "px";
    	m[i].style.border = "1px solid #37393b";
    	m[i].style.boxSizing = "border-box";
    	m[i].style.backgroundColor = "transparent";
    	p.appendChild(m[i]);
    }
}

//================================================================//

/*A function that animates the movement of the cloud.*/
function weather(cloud, speed) {

	requestAnimationFrame(move);

	function move() {
		if (parseInt(cloud.style.left) > boxHeight*(colNum + 1)) {
			cloud.style.left = -200 + Math.round(Math.random()*50) + "px";
			cloud.style.top = Math.round(Math.random()*boxHeight*8) + "px";
			speed = Math.round(Math.random()) + 1;
			if (goClouds) {
				requestAnimationFrame(move, speed);
			}
		} else {
			cloud.style.left = parseInt(cloud.style.left) + speed + "px";
			if (goClouds) {
				requestAnimationFrame(move, speed);
			} else {
				return;
			}
		}
	}
}

/*A function that makes a cloud, or more precisely, a reference frame
around which clouds will be made using myCloud().*/
function createCloud(id, left, mainContainer) {
	let el = createElement("div", mainContainer);
	el.setAttribute("id", id);
	el.style.position = "absolute";
	el.style.zIndex = 300;
	el.style.top = Math.round(Math.random()*boxHeight*rowNum) + "px";
	el.style.left = left + "px";
	myCloud(el);
}

/*A function that creates a cloud, which is a conglomerate of 
5 points all tied to the same reference frame, and around them 
boxes that represent clouds are created.*/
function myCloud(c) {

	let t1 = pointCreation(c, 30, 30);
	let t2 = pointCreation(c, -30, 30);
	let t3 = pointCreation(c, 0, 40);
	let t4 = pointCreation(t3, 30, 30);
	let t5 = pointCreation(t3, -30, 30);

	for(let i = 0; i < 3; i++) {
		cloudCreation(c);
		cloudCreation(t1);
		cloudCreation(t2);

		let k = Math.round(Math.random()) ? 1 : -1;
		t3.style.top = Math.round(Math.random()*55)*k + "px";
		cloudCreation(t3);
		cloudCreation(t4);
		cloudCreation(t5);
	}


	function pointCreation(parent, top, left) {
		let el = document.createElement("div");
		parent.appendChild(el);
		el.style.position = "absolute";
		el.style.top = top + "px";
		el.style.left = left + "px";
		return el;
	}

	function cloudCreation(parent) {

		let cloudColor = ["whitesmoke", "#d5f0f3", "#c5f2f7", "#e3fbff"];
		let el = document.createElement("div");
		parent.appendChild(el);

		el.style.position = "absolute";
		el.style.width = Math.round(Math.random()*40) + 25 + "px";
		el.style.height = Math.round(Math.random()*40) + 25 + "px";
		let p1 = Math.round(Math.random()) ? 1 : -1;
		let p2 = Math.round(Math.random()) ? 1 : -1;
		el.style.top = Math.round(Math.random()*20)*p1 + "px";
		el.style.left = Math.round(Math.random()*20)*p2 + "px";
		let par = Math.round(Math.random()*(cloudColor.length - 1));
		el.style.backgroundColor = cloudColor[par];
		el.style.borderRadius = "10px";
	}
}

//================================================================//

/*Creator of a standard "box", as I call it. A full grid of 
these boxes in a map. They are used for map building 
and are placed in grid.main.*/
function boxCreation(mainContainer) {
	let newEl = createElement("div", mainContainer);
	newEl.style.position = "absolute";
	newEl.style.height = boxHeight + "px";
	newEl.style.width = boxHeight + "px";
	return newEl;
}

/*A function that returns numbers that represent, when added
 to the left and top values of a previous box, coordinates of 
 a new box that is adjacent to the previous one. If numbers 
 are 0 && 0 or the new box would be out of the grid, the function 
 is invoked again until those conditions are met. If those 
 cordinates turn out to be the same of some existing box, 
 that problem is addressed using randomGridNums().*/
function nearestBoxCoordinates() {
	let a = [];
	a[0] = Math.round(Math.random()*2) - 1;
	a[1] = Math.round(Math.random()*2) - 1;
	return a;
}

/*Prints a 2D sequence to the console, in grid form.*/
function gridPrint(grid) {
	let s = "";
	for(let i = 0; i < grid.length; i++) {
		for(let j = 0; j < grid[i].length; j++) {
			s += grid[i][j] + " ";
		}
		s += "\n";
	}
	console.log(s);
}

/*Made to avoid my previous problem with stack overflow,
 which was a very bad mistake on my part. I had made a function 
 that looks for places around the previous box, and if that place 
 is taken, it recursively calls itself again. The problem was 
 evident when there were no free places around the said previous box. 
 Anyway, randomGridNums() is invoked when the call to nearestBoxCordinates 
 yields place in a grid that is already taken. This function simply 
 gives you a random place. If that one too is taken, it is invoked again, 
 all happening in boxesCreation*/
function randomGridNums() {
	let a = [];
	a[0] = Math.round(Math.random()*(colNum - 1));
	a[1] = Math.round(Math.random()*(rowNum - 1));
	return a;
}

/*2D sequence initialization. Important note: it gives every element
 the same value.*/
function twoDimesionalSeqInit(seq, value, h, w) {
	for(let i = 0; i < h; i++) {
		seq[i] = new Array();
		for(let j = 0; j < w; j++) {
			seq[i][j] = value;
		}
	}
}

/*Element creation*/
function createElement(el, parentId) {
    let element = document.createElement(el);
    parentId.appendChild(element);
    return element;
}

/*ID catcher*/
function idCatch(id) {
    return document.getElementById(id);
}

//================================================================//

/*Functions used in our search for the path between two cities*/

/*This one returns an array of points that are adjacent to "x", if they
are not water divs.*/
function surroundings(x, y, b) {
	let a = [];
	
	if ((x + 1 >= 0 && x + 1 < 6) && (y >= 0 && y < 14)) {
		if (isItGround(x + 1, y, b)) {
			a.push([x + 1, y]);
		}
	}
	if ((x >= 0 && x < 6) && (y + 1 >= 0 && y + 1 < 14)) {
		if (isItGround(x, y + 1, b)) {
			a.push([x, y + 1]);
		}
	}
	if ((x - 1 >= 0 && x - 1 < 6) && (y >= 0 && y < 14)) {
		if (isItGround(x - 1, y, b)) {
			a.push([x - 1, y]);
		}
	}
	if ((x >= 0 && x < 6) && (y - 1 >= 0 && y - 1 < 14)) {
		if (isItGround(x, y - 1, b)) {
			a.push([x, y - 1]);
		}
	}

	return a;
}

/*A function that tells us if a certain box is ground div or not.*/
function isItGround(x, y, b) {
	if(b[x][y] == "G" || b[x][y] == "C" || b[x][y] == "Y" || b[x][y] == "B") {
		return true;
	} else {
		return false;
	}
}

/*A function that picks an array of smallest length in an array*/
function smallestArr(A) {
	let min = A[0].length;
	let index = 0;
	for (let i = 0; i < A.length; i++) {
		if(A[i].length < min) {
			min = A[i].length;
			index = i;
		}
	}
	return index;
}

/*A function that tells us from which side is "prev" located next to "x"*/
function fromWhichSide(x, prev) {
	if(x[0] == prev[0] && x[1] > prev[1]) {
		return "left";
	} else if(x[0] == prev[0] && x[1] < prev[1]) {
		return "right";
	} else if(x[0] > prev[0] && x[1] == prev[1]) {
		return "top";
	} else if(x[0] < prev[0] && x[1] == prev[1]) {
		return "bottom";
	}
}

/*A function that returns an array of points that are connected to
the input coordinates via ground.*/
function groundConnection(coordinates, roadMap) {
	let arr = [];
	arr[0] = coordinates;
	let k = [];
	roadMap[coordinates[0]][coordinates[1]] = "C";
	let myI = 0;

	do {
		let z = arr.length;
		for(let i = myI; i < z; i++) {
			k.length = 0;
			k = surroundings(arr[i][0], arr[i][1], grid.style);
				
			let br = 0;
			let o = false;
			while(br < k.length) {
				o = false;
				for(let j = 0; j < arr.length; j++) {
					if(k[br][0] == arr[j][0] && k[br][1] == arr[j][1]){
						o = true;
					}
				}
				if(o == false) {
					arr.push(k[br]);
				}
				br++;
			}
		}
		myI = z;

	} while (myI != arr.length);

	return arr;
}
//================================================================//

/*Road-building functions*/

/*This one builds road using the information from route[]*/
function roadMaker(parent, x, prevOrNext, roadWidth, next, lineNumber) {
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.zIndex = 51;
	el.style.backgroundColor = "rgb(14, 19, 27)";
	if(fromWhichSide(x, prevOrNext) == "left") {
		el.style.height = roadWidth + "px";
		el.style.width = boxHeight/2 + roadWidth/2 + "px";
		el.style.top = boxHeight/2 - roadWidth/2 + "px";
		el.style.left = 0 + "px";
		createLine(parent, el, parseInt(el.style.top), 0, -1, -1, roadWidth, prevOrNext, next, lineNumber);
	} else if(fromWhichSide(x, prevOrNext) == "right") {
		el.style.height =  roadWidth + "px";
		el.style.top = boxHeight/2 - roadWidth/2 + "px";
		el.style.right = 0 + "px";
		el.style.width = boxHeight/2 + roadWidth/2 + "px";
		createLine(parent, el, parseInt(el.style.top), -1, 0, -1, roadWidth, prevOrNext, next, lineNumber);
	} else if(fromWhichSide(x, prevOrNext) == "bottom") {
		el.style.width =  roadWidth + "px";
		el.style.bottom = 0 + "px";
		el.style.left = boxHeight/2 - roadWidth/2 + "px";
		el.style.height = boxHeight/2 + roadWidth/2 + "px";
		createLine(parent, el, -1, parseInt(el.style.left), -1, 0, roadWidth, prevOrNext, next, lineNumber);
	} else if(fromWhichSide(x, prevOrNext) == "top") {
		el.style.width =  roadWidth + "px";
		el.style.height = boxHeight/2 + roadWidth/2 + "px";
		el.style.top = 0 + "px";
		el.style.left = boxHeight/2 - roadWidth/2 + "px";
		el.style.height = boxHeight/2 + roadWidth/2 + "px";
		createLine(parent, el, 0, parseInt(el.style.left), -1, -1, roadWidth, prevOrNext, next, lineNumber);
	}
	if(grid.style[x[0]][x[1]] == "B") {
		el.style.outline = "3px solid rgb(14, 19, 27)";
	}
}

/*This one creates traffic lines. There is some code here that seems redundant,
but I might use it sometime.*/
function createLine(parent, el, top, left, right, bottom, roadWidth, prevOrNext, next, lineNumber) {
	let line = createElement("div", parent);
	line.style.position = "absolute";
	line.style.zIndex = 53;
	if (parseInt(el.style.width) < parseInt(el.style.height)) {
		line.style.width = "1px";
		if(fromWhichSide(el, prevOrNext) == fromWhichSide(el,next)) {
			line.style.height = parseInt(el.style.height) - roadWidth/2 + "px";
		} else {
			line.style.height = parseInt(el.style.height) - roadWidth + "px";
		}
	
	} else {
		line.style.height = "1px";
		if(fromWhichSide(el, prevOrNext) == fromWhichSide(el,next)) {
			line.style.width = parseInt(el.style.width) - roadWidth/2 + "px";
		} else {
			line.style.width = parseInt(el.style.width) - roadWidth + "px";
		}
	}

	if(top != -1) {
		if(parseInt(el.style.width) > parseInt(el.style.height)) {
			line.style.top = top + roadWidth/2 - 1 + "px";
		} else {
			line.style.top = top + "px";
		}
	} 
	if(left != -1) {
		if(parseInt(el.style.width) < parseInt(el.style.height)) {
			line.style.left = left + roadWidth/2 - 1 + "px";
		} else {
			line.style.left = left + "px";
		}
	} 
	if(bottom != -1) {
		if(parseInt(el.style.width) > parseInt(el.style.height)) {
			line.style.bottom = bottom + roadWidth/2 - 1 + "px";
		} else {
			line.style.bottom = bottom + "px";
		}
	} 
	if(right != -1) {
		if(parseInt(el.style.width) < parseInt(el.style.height)) {
			line.style.right = right + roadWidth/2 - 1 + "px";
		} else {
			line.style.right = right + "px";
		}
	}

	for(let i = 0; i < lineNumber; i++) {
		let cns = (parseInt(el.style.height) - roadWidth/2)/6;
		let l = createElement("div", line);
		l.style.position = "absolute";
		l.style.backgroundColor = "white";
		if (parseInt(el.style.width) < parseInt(el.style.height)) {
			l.style.width = "2px";
			l.style.height = cns + "px";
			l.style.left = "0px";
			l.style.top = cns*i*2 + "px"
		} else {
			cns = (parseInt(el.style.width) - roadWidth/2)/6;
			l.style.height = "2px";
			l.style.width = cns + "px";
			l.style.top = "0px";
			l.style.left = cns*i*2 + "px"
		}
	}
}

/*A function that creates extensions for road on divs where cities are
located, which would be the last and the first element of route[]*/
function begOrEnd(x, prevOrNext, parent, roadWidth, boxHeight) {
	let el = createElement("div", parent);
	el.style.position = "absolute";
	el.style.backgroundColor = "rgb(14, 19, 27)";
	el.style.height = roadWidth + "px";
	el.style.width = roadWidth + "px";
	if(fromWhichSide(x, prevOrNext) == "left") {
		el.style.top = boxHeight/2 - roadWidth/2 + "px";
		el.style.left = 0 + "px";
	} else if(fromWhichSide(x, prevOrNext) == "right") {
		el.style.top = boxHeight/2 - roadWidth/2 + "px";
		el.style.right = 0 + "px";
	} else if(fromWhichSide(x, prevOrNext) == "top") {
		el.style.left = boxHeight/2 - roadWidth/2 + "px";
		el.style.top = 0 + "px";
	} else if(fromWhichSide(x, prevOrNext) == "bottom") {
		el.style.left = boxHeight/2 - roadWidth/2 + "px";
		el.style.bottom = 0 + "px";
	}
}

//================================================================//