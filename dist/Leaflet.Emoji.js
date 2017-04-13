(function () {
'use strict';

/**
 * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
 *
 * @name getCoord
 * @param {Array<any>|Geometry|Feature<Point>} obj any value
 * @returns {Array<number>} coordinates
 */
function getCoord(obj) {
    if (!obj) throw new Error('No obj passed');

    var coordinates = getCoords(obj);

    // getCoord() must contain at least two numbers (Point)
    if (coordinates.length > 1 &&
        typeof coordinates[0] === 'number' &&
        typeof coordinates[1] === 'number') {
        return coordinates;
    } else {
        throw new Error('Coordinate is not a valid Point');
    }
}

/**
 * Unwrap coordinates from a Feature, Geometry Object or an Array of numbers
 *
 * @name getCoords
 * @param {Array<any>|Geometry|Feature<any>} obj any value
 * @returns {Array<any>} coordinates
 */
function getCoords(obj) {
    if (!obj) throw new Error('No obj passed');
    var coordinates;

    // Array of numbers
    if (obj.length) {
        coordinates = obj;

    // Geometry Object
    } else if (obj.coordinates) {
        coordinates = obj.coordinates;

    // Feature
    } else if (obj.geometry && obj.geometry.coordinates) {
        coordinates = obj.geometry.coordinates;
    }
    // Checks if coordinates contains a number
    if (coordinates) {
        containsNumber(coordinates);
        return coordinates;
    }
    throw new Error('No valid coordinates');
}

/**
 * Checks if coordinates contains a number
 *
 * @name containsNumber
 * @param {Array<any>} coordinates GeoJSON Coordinates
 * @returns {boolean} true if Array contains a number
 */
function containsNumber(coordinates) {
    if (coordinates.length > 1 &&
        typeof coordinates[0] === 'number' &&
        typeof coordinates[1] === 'number') {
        return true;
    }

    if (Array.isArray(coordinates[0]) && coordinates[0].length) {
        return containsNumber(coordinates[0]);
    }
    throw new Error('coordinates must only contain numbers');
}

/**
 * Enforce expectations about types of GeoJSON objects for Turf.
 *
 * @name geojsonType
 * @param {GeoJSON} value any GeoJSON object
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function geojsonType(value, type, name) {
    if (!type || !name) throw new Error('type and name required');

    if (!value || value.type !== type) {
        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + value.type);
    }
}

/**
 * Enforce expectations about types of {@link Feature} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name featureOf
 * @param {Feature} feature a feature with an expected geometry type
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} error if value is not the expected type.
 */
function featureOf(feature, type, name) {
    if (!feature) throw new Error('No feature passed');
    if (!name) throw new Error('.featureOf() requires a name');
    if (!feature || feature.type !== 'Feature' || !feature.geometry) {
        throw new Error('Invalid input to ' + name + ', Feature with geometry required');
    }
    if (!feature.geometry || feature.geometry.type !== type) {
        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
    }
}

/**
 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name collectionOf
 * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */
function collectionOf(featureCollection, type, name) {
    if (!featureCollection) throw new Error('No featureCollection passed');
    if (!name) throw new Error('.collectionOf() requires a name');
    if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
        throw new Error('Invalid input to ' + name + ', FeatureCollection required');
    }
    for (var i = 0; i < featureCollection.features.length; i++) {
        var feature = featureCollection.features[i];
        if (!feature || feature.type !== 'Feature' || !feature.geometry) {
            throw new Error('Invalid input to ' + name + ', Feature with geometry required');
        }
        if (!feature.geometry || feature.geometry.type !== type) {
            throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
        }
    }
}

var index$1 = {
    geojsonType: geojsonType,
    collectionOf: collectionOf,
    featureOf: featureOf,
    getCoord: getCoord,
    getCoords: getCoords,
    containsNumber: containsNumber
};

// http://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
// modified from: https://github.com/substack/point-in-polygon/blob/master/index.js
// which was modified from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

/**
 * Takes a {@link Point} and a {@link Polygon} or {@link MultiPolygon} and determines if the point resides inside the polygon. The polygon can
 * be convex or concave. The function accounts for holes.
 *
 * @name inside
 * @param {Feature<Point>} point input point
 * @param {Feature<(Polygon|MultiPolygon)>} polygon input polygon or multipolygon
 * @returns {boolean} `true` if the Point is inside the Polygon; `false` if the Point is not inside the Polygon
 * @example
 * var pt = turf.point([-77, 44]);
 * var poly = turf.polygon([[
 *   [-81, 41],
 *   [-81, 47],
 *   [-72, 47],
 *   [-72, 41],
 *   [-81, 41]
 * ]]);
 *
 * var isInside = turf.inside(pt, poly);
 *
 * //=isInside
 */
var index = function (point, polygon) {
    var pt = index$1.getCoord(point);
    var polys = polygon.geometry.coordinates;
    // normalize to multipolygon
    if (polygon.geometry.type === 'Polygon') polys = [polys];

    for (var i = 0, insidePoly = false; i < polys.length && !insidePoly; i++) {
        // check if it is in the outer ring first
        if (inRing(pt, polys[i][0])) {
            var inHole = false;
            var k = 1;
            // check for the point in any of the holes
            while (k < polys[i].length && !inHole) {
                if (inRing(pt, polys[i][k], true)) {
                    inHole = true;
                }
                k++;
            }
            if (!inHole) insidePoly = true;
        }
    }
    return insidePoly;
};

// pt is [x,y] and ring is [[x,y], [x,y],..]
function inRing(pt, ring, ignoreBoundary) {
    var isInside = false;
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring = ring.slice(0, ring.length - 1);

    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1];
        var xj = ring[j][0], yj = ring[j][1];
        var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
            ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
        if (onBoundary) return !ignoreBoundary;
        var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

/**
 * Callback for coordEach
 *
 * @private
 * @callback coordEachCallback
 * @param {[number, number]} currentCoords The current coordinates being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
 *
 * @name coordEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (currentCoords, currentIndex)
 * @param {boolean} [excludeWrapCoord=false] whether or not to include
 * the final coordinate of LinearRings that wraps the ring in its iteration.
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.coordEach(features, function (currentCoords, currentIndex) {
 *   //=currentCoords
 *   //=currentIndex
 * });
 */
function coordEach(layer, callback, excludeWrapCoord) {
    var i, j, k, g, l, geometry, stopG, coords,
        geometryMaybeCollection,
        wrapShrink = 0,
        currentIndex = 0,
        isGeometryCollection,
        isFeatureCollection = layer.type === 'FeatureCollection',
        isFeature = layer.type === 'Feature',
        stop = isFeatureCollection ? layer.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
        (isFeature ? layer.geometry : layer));
        isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
            geometryMaybeCollection.geometries[g] : geometryMaybeCollection;
            coords = geometry.coordinates;

            wrapShrink = (excludeWrapCoord &&
                (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) ?
                1 : 0;

            if (geometry.type === 'Point') {
                callback(coords, currentIndex);
                currentIndex++;
            } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
                for (j = 0; j < coords.length; j++) {
                    callback(coords[j], currentIndex);
                    currentIndex++;
                }
            } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
                for (j = 0; j < coords.length; j++)
                    for (k = 0; k < coords[j].length - wrapShrink; k++) {
                        callback(coords[j][k], currentIndex);
                        currentIndex++;
                    }
            } else if (geometry.type === 'MultiPolygon') {
                for (j = 0; j < coords.length; j++)
                    for (k = 0; k < coords[j].length; k++)
                        for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                            callback(coords[j][k][l], currentIndex);
                            currentIndex++;
                        }
            } else if (geometry.type === 'GeometryCollection') {
                for (j = 0; j < geometry.geometries.length; j++)
                    coordEach(geometry.geometries[j], callback, excludeWrapCoord);
            } else {
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}

/**
 * Callback for coordReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @private
 * @callback coordReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {[number, number]} currentCoords The current coordinate being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
 *
 * @name coordReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentCoords, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @param {boolean} [excludeWrapCoord=false] whether or not to include
 * the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.coordReduce(features, function (previousValue, currentCoords, currentIndex) {
 *   //=previousValue
 *   //=currentCoords
 *   //=currentIndex
 *   return currentCoords;
 * });
 */
function coordReduce(layer, callback, initialValue, excludeWrapCoord) {
    var previousValue = initialValue;
    coordEach(layer, function (currentCoords, currentIndex) {
        if (currentIndex === 0 && initialValue === undefined) {
            previousValue = currentCoords;
        } else {
            previousValue = callback(previousValue, currentCoords, currentIndex);
        }
    }, excludeWrapCoord);
    return previousValue;
}

/**
 * Callback for propEach
 *
 * @private
 * @callback propEachCallback
 * @param {*} currentProperties The current properties being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Iterate over properties in any GeoJSON object, similar to Array.forEach()
 *
 * @name propEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (currentProperties, currentIndex)
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {"foo": "bar"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {"hello": "world"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.propEach(features, function (currentProperties, currentIndex) {
 *   //=currentProperties
 *   //=currentIndex
 * });
 */
function propEach(layer, callback) {
    var i;
    switch (layer.type) {
    case 'FeatureCollection':
        for (i = 0; i < layer.features.length; i++) {
            callback(layer.features[i].properties, i);
        }
        break;
    case 'Feature':
        callback(layer.properties, 0);
        break;
    }
}


/**
 * Callback for propReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @private
 * @callback propReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {*} currentProperties The current properties being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce properties in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all properties is unnecessary.
 *
 * @name propReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentProperties, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {"foo": "bar"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {"hello": "world"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.propReduce(features, function (previousValue, currentProperties, currentIndex) {
 *   //=previousValue
 *   //=currentProperties
 *   //=currentIndex
 *   return currentProperties
 * });
 */
function propReduce(layer, callback, initialValue) {
    var previousValue = initialValue;
    propEach(layer, function (currentProperties, currentIndex) {
        if (currentIndex === 0 && initialValue === undefined) {
            previousValue = currentProperties;
        } else {
            previousValue = callback(previousValue, currentProperties, currentIndex);
        }
    });
    return previousValue;
}

/**
 * Callback for featureEach
 *
 * @private
 * @callback featureEachCallback
 * @param {Feature<any>} currentFeature The current feature being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Iterate over features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name featureEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, currentIndex)
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.featureEach(features, function (currentFeature, currentIndex) {
 *   //=currentFeature
 *   //=currentIndex
 * });
 */
function featureEach(layer, callback) {
    if (layer.type === 'Feature') {
        callback(layer, 0);
    } else if (layer.type === 'FeatureCollection') {
        for (var i = 0; i < layer.features.length; i++) {
            callback(layer.features[i], i);
        }
    }
}

/**
 * Callback for featureReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @private
 * @callback featureReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<any>} currentFeature The current Feature being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name featureReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {"foo": "bar"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {"hello": "world"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.featureReduce(features, function (previousValue, currentFeature, currentIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=currentIndex
 *   return currentFeature
 * });
 */
function featureReduce(layer, callback, initialValue) {
    var previousValue = initialValue;
    featureEach(layer, function (currentFeature, currentIndex) {
        if (currentIndex === 0 && initialValue === undefined) {
            previousValue = currentFeature;
        } else {
            previousValue = callback(previousValue, currentFeature, currentIndex);
        }
    });
    return previousValue;
}

/**
 * Get all coordinates from any GeoJSON object.
 *
 * @name coordAll
 * @param {Object} layer any GeoJSON object
 * @returns {Array<Array<number>>} coordinate position array
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * var coords = turf.coordAll(features);
 * //=coords
 */
function coordAll(layer) {
    var coords = [];
    coordEach(layer, function (coord) {
        coords.push(coord);
    });
    return coords;
}

/**
 * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
 *
 * @name geomEach
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (currentGeometry, currentIndex)
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.geomEach(features, function (currentGeometry, currentIndex) {
 *   //=currentGeometry
 *   //=currentIndex
 * });
 */
function geomEach(layer, callback) {
    var i, j, g, geometry, stopG,
        geometryMaybeCollection,
        isGeometryCollection,
        currentIndex = 0,
        isFeatureCollection = layer.type === 'FeatureCollection',
        isFeature = layer.type === 'Feature',
        stop = isFeatureCollection ? layer.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
    for (i = 0; i < stop; i++) {

        geometryMaybeCollection = (isFeatureCollection ? layer.features[i].geometry :
        (isFeature ? layer.geometry : layer));
        isGeometryCollection = geometryMaybeCollection.type === 'GeometryCollection';
        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

        for (g = 0; g < stopG; g++) {
            geometry = isGeometryCollection ?
            geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

            if (geometry.type === 'Point' ||
                geometry.type === 'LineString' ||
                geometry.type === 'MultiPoint' ||
                geometry.type === 'Polygon' ||
                geometry.type === 'MultiLineString' ||
                geometry.type === 'MultiPolygon') {
                callback(geometry, currentIndex);
                currentIndex++;
            } else if (geometry.type === 'GeometryCollection') {
                for (j = 0; j < geometry.geometries.length; j++) {
                    callback(geometry.geometries[j], currentIndex);
                    currentIndex++;
                }
            } else {
                throw new Error('Unknown Geometry Type');
            }
        }
    }
}

/**
 * Callback for geomReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @private
 * @callback geomReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {*} currentGeometry The current Feature being processed.
 * @param {number} currentIndex The index of the current element being processed in the
 * array.Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 */

/**
 * Reduce geometry in any GeoJSON object, similar to Array.reduce().
 *
 * @name geomReduce
 * @param {Object} layer any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentGeometry, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {"foo": "bar"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [26, 37]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {"hello": "world"},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [36, 53]
 *       }
 *     }
 *   ]
 * };
 * turf.geomReduce(features, function (previousValue, currentGeometry, currentIndex) {
 *   //=previousValue
 *   //=currentGeometry
 *   //=currentIndex
 *   return currentGeometry
 * });
 */
function geomReduce(layer, callback, initialValue) {
    var previousValue = initialValue;
    geomEach(layer, function (currentGeometry, currentIndex) {
        if (currentIndex === 0 && initialValue === undefined) {
            previousValue = currentGeometry;
        } else {
            previousValue = callback(previousValue, currentGeometry, currentIndex);
        }
    });
    return previousValue;
}

var index$6 = {
    coordEach: coordEach,
    coordReduce: coordReduce,
    propEach: propEach,
    propReduce: propReduce,
    featureEach: featureEach,
    featureReduce: featureReduce,
    coordAll: coordAll,
    geomEach: geomEach,
    geomReduce: geomReduce
};

var each = index$6.coordEach;

/**
 * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
 *
 * @name bbox
 * @param {(Feature|FeatureCollection)} geojson input features
 * @returns {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
 * @addToMap features, bboxPolygon
 * @example
 * var pt1 = turf.point([114.175329, 22.2524])
 * var pt2 = turf.point([114.170007, 22.267969])
 * var pt3 = turf.point([114.200649, 22.274641])
 * var pt4 = turf.point([114.200649, 22.274641])
 * var pt5 = turf.point([114.186744, 22.265745])
 * var features = turf.featureCollection([pt1, pt2, pt3, pt4, pt5])
 *
 * var bbox = turf.bbox(features);
 *
 * var bboxPolygon = turf.bboxPolygon(bbox);
 *
 * //=bbox
 *
 * //=bboxPolygon
 */
var index$4 = function (geojson) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    each(geojson, function (coord) {
        if (bbox[0] > coord[0]) bbox[0] = coord[0];
        if (bbox[1] > coord[1]) bbox[1] = coord[1];
        if (bbox[2] < coord[0]) bbox[2] = coord[0];
        if (bbox[3] < coord[1]) bbox[3] = coord[1];
    });
    return bbox;
};

/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} properties properties
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var geometry = {
 *      "type": "Point",
 *      "coordinates": [
 *        67.5,
 *        32.84267363195431
 *      ]
 *    }
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geometry, properties) {
    if (!geometry) throw new Error('No geometry passed');

    return {
        type: 'Feature',
        properties: properties || {},
        geometry: geometry
    };
}

/**
 * Takes coordinates and properties (optional) and returns a new {@link Point} feature.
 *
 * @name point
 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object=} properties an Object that is used as the {@link Feature}'s
 * properties
 * @returns {Feature<Point>} a Point feature
 * @example
 * var pt1 = turf.point([-75.343, 39.984]);
 *
 * //=pt1
 */
function point(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');
    if (coordinates.length === undefined) throw new Error('Coordinates must be an array');
    if (coordinates.length < 2) throw new Error('Coordinates must be at least 2 numbers long');
    if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') throw new Error('Coordinates must numbers');

    return feature({
        type: 'Point',
        coordinates: coordinates
    }, properties);
}

/**
 * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object=} properties a properties object
 * @returns {Feature<Polygon>} a Polygon feature
 * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
 * or if a LinearRing of the Polygon does not have matching Positions at the
 * beginning & end.
 * @example
 * var polygon = turf.polygon([[
 *  [-2.275543, 53.464547],
 *  [-2.275543, 53.489271],
 *  [-2.215118, 53.489271],
 *  [-2.215118, 53.464547],
 *  [-2.275543, 53.464547]
 * ]], { name: 'poly1', population: 400});
 *
 * //=polygon
 */
function polygon$1(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');

    for (var i = 0; i < coordinates.length; i++) {
        var ring = coordinates[i];
        if (ring.length < 4) {
            throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error('First and last Position are not equivalent.');
            }
        }
    }

    return feature({
        type: 'Polygon',
        coordinates: coordinates
    }, properties);
}

/**
 * Creates a {@link LineString} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<LineString>} a LineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var linestring1 = turf.lineString([
 *   [-21.964416, 64.148203],
 *   [-21.956176, 64.141316],
 *   [-21.93901, 64.135924],
 *   [-21.927337, 64.136673]
 * ]);
 * var linestring2 = turf.lineString([
 *   [-21.929054, 64.127985],
 *   [-21.912918, 64.134726],
 *   [-21.916007, 64.141016],
 *   [-21.930084, 64.14446]
 * ], {name: 'line 1', distance: 145});
 *
 * //=linestring1
 *
 * //=linestring2
 */
function lineString(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');

    return feature({
        type: 'LineString',
        coordinates: coordinates
    }, properties);
}

/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @returns {FeatureCollection} a FeatureCollection of input features
 * @example
 * var features = [
 *  turf.point([-75.343, 39.984], {name: 'Location A'}),
 *  turf.point([-75.833, 39.284], {name: 'Location B'}),
 *  turf.point([-75.534, 39.123], {name: 'Location C'})
 * ];
 *
 * var fc = turf.featureCollection(features);
 *
 * //=fc
 */
function featureCollection(features) {
    if (!features) throw new Error('No features passed');

    return {
        type: 'FeatureCollection',
        features: features
    };
}

/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 *
 */
function multiLineString(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');

    return feature({
        type: 'MultiLineString',
        coordinates: coordinates
    }, properties);
}

/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 *
 */
function multiPoint(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');

    return feature({
        type: 'MultiPoint',
        coordinates: coordinates
    }, properties);
}


/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
 *
 * //=multiPoly
 *
 */
function multiPolygon(coordinates, properties) {
    if (!coordinates) throw new Error('No coordinates passed');

    return feature({
        type: 'MultiPolygon',
        coordinates: coordinates
    }, properties);
}

/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<{Geometry}>} geometries an array of GeoJSON Geometries
 * @param {Object=} properties an Object of key-value pairs to add as properties
 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
 * @example
 * var pt = {
 *     "type": "Point",
 *       "coordinates": [100, 0]
 *     };
 * var line = {
 *     "type": "LineString",
 *     "coordinates": [ [101, 0], [102, 1] ]
 *   };
 * var collection = turf.geometryCollection([pt, line]);
 *
 * //=collection
 */
function geometryCollection(geometries, properties) {
    if (!geometries) throw new Error('No geometries passed');

    return feature({
        type: 'GeometryCollection',
        geometries: geometries
    }, properties);
}

var factors = {
    miles: 3960,
    nauticalmiles: 3441.145,
    degrees: 57.2957795,
    radians: 1,
    inches: 250905600,
    yards: 6969600,
    meters: 6373000,
    metres: 6373000,
    kilometers: 6373,
    kilometres: 6373,
    feet: 20908792.65
};

/**
 * Convert a distance measurement from radians to a more friendly unit.
 *
 * @name radiansToDistance
 * @param {number} radians in radians across the sphere
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} distance
 */
function radiansToDistance(radians, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) throw new Error('Invalid unit');

    return radians * factor;
}

/**
 * Convert a distance measurement from a real-world unit into radians
 *
 * @name distanceToRadians
 * @param {number} distance in real units
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} radians
 */
function distanceToRadians(distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) throw new Error('Invalid unit');

    return distance / factor;
}

/**
 * Convert a distance measurement from a real-world unit into degrees
 *
 * @name distanceToDegrees
 * @param {number} distance in real units
 * @param {string} [units=kilometers] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
 * @returns {number} degrees
 */
function distanceToDegrees(distance, units) {
    var factor = factors[units || 'kilometers'];
    if (factor === undefined) throw new Error('Invalid unit');

    return (distance / factor) * 57.2958;
}

var index$10 = {
    feature: feature,
    featureCollection: featureCollection,
    geometryCollection: geometryCollection,
    point: point,
    multiPoint: multiPoint,
    lineString: lineString,
    multiLineString: multiLineString,
    polygon: polygon$1,
    multiPolygon: multiPolygon,
    radiansToDistance: radiansToDistance,
    distanceToRadians: distanceToRadians,
    distanceToDegrees: distanceToDegrees
};

var polygon = index$10.polygon;

/**
 * Takes a bbox and returns an equivalent {@link Polygon|polygon}.
 *
 * @name bboxPolygon
 * @param {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
 * @return {Feature<Polygon>} a Polygon representation of the bounding box
 * @addToMap poly
 * @example
 * var bbox = [0, 0, 10, 10];
 *
 * var poly = turf.bboxPolygon(bbox);
 *
 * //=poly
 */

var index$8 = function (bbox) {
    var lowLeft = [bbox[0], bbox[1]];
    var topLeft = [bbox[0], bbox[3]];
    var topRight = [bbox[2], bbox[3]];
    var lowRight = [bbox[2], bbox[1]];

    return polygon([[
        lowLeft,
        lowRight,
        topRight,
        topLeft,
        lowLeft
    ]]);
};

/**
 * Takes any number of features and returns a rectangular {@link Polygon} that encompasses all vertices.
 *
 * @name envelope
 * @param {(Feature|FeatureCollection)} features input features
 * @return {Feature<Polygon>} a rectangular Polygon feature that encompasses all vertices
 * @example
 * var fc = {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "name": "Location A"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-75.343, 39.984]
 *       }
 *     }, {
 *       "type": "Feature",
 *       "properties": {
 *         "name": "Location B"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-75.833, 39.284]
 *       }
 *     }, {
 *       "type": "Feature",
 *       "properties": {
 *         "name": "Location C"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-75.534, 39.123]
 *       }
 *     }
 *   ]
 * };
 *
 * var enveloped = turf.envelope(fc);
 *
 * var resultFeatures = fc.features.concat(enveloped);
 * var result = {
 *   "type": "FeatureCollection",
 *   "features": resultFeatures
 * };
 *
 * //=result
 */

var index$3 = function (features) {
    return index$8(index$4(features));
};

var shortcodes = { ':interrobang:': [ 8265 ],
  ':tm:': [ 8482 ],
  ':information_source:': [ 8505 ],
  ':left_right_arrow:': [ 8596 ],
  ':arrow_up_down:': [ 8597 ],
  ':arrow_upper_left:': [ 8598 ],
  ':arrow_upper_right:': [ 8599 ],
  ':arrow_lower_right:': [ 8600 ],
  ':arrow_lower_left:': [ 8601 ],
  ':keyboard:': [ 9000 ],
  ':sunny:': [ 9728 ],
  ':cloud:': [ 9729 ],
  ':umbrella2:': [ 9730 ],
  ':snowman2:': [ 9731 ],
  ':comet:': [ 9732 ],
  ':ballot_box_with_check:': [ 9745 ],
  ':umbrella:': [ 9748 ],
  ':coffee:': [ 9749 ],
  ':shamrock:': [ 9752 ],
  ':skull_and_crossbones:': [ 9760 ],
  ':skull_crossbones:': [ 9760 ],
  ':radioactive_sign:': [ 9762 ],
  ':radioactive:': [ 9762 ],
  ':biohazard_sign:': [ 9763 ],
  ':biohazard:': [ 9763 ],
  ':orthodox_cross:': [ 9766 ],
  ':wheel_of_dharma:': [ 9784 ],
  ':white_frowning_face:': [ 9785 ],
  ':frowning2:': [ 9785 ],
  ':aries:': [ 9800 ],
  ':taurus:': [ 9801 ],
  ':sagittarius:': [ 9808 ],
  ':capricorn:': [ 9809 ],
  ':aquarius:': [ 9810 ],
  ':pisces:': [ 9811 ],
  ':spades:': [ 9824 ],
  ':clubs:': [ 9827 ],
  ':hearts:': [ 9829 ],
  ':diamonds:': [ 9830 ],
  ':hotsprings:': [ 9832 ],
  ':hammer_and_pick:': [ 9874 ],
  ':hammer_pick:': [ 9874 ],
  ':anchor:': [ 9875 ],
  ':crossed_swords:': [ 9876 ],
  ':scales:': [ 9878 ],
  ':alembic:': [ 9879 ],
  ':gear:': [ 9881 ],
  ':scissors:': [ 9986 ],
  ':white_check_mark:': [ 9989 ],
  ':airplane:': [ 9992 ],
  ':envelope:': [ 9993 ],
  ':black_nib:': [ 10002 ],
  ':heavy_check_mark:': [ 10004 ],
  ':heavy_multiplication_x:': [ 10006 ],
  ':star_of_david:': [ 10017 ],
  ':sparkles:': [ 10024 ],
  ':eight_spoked_asterisk:': [ 10035 ],
  ':eight_pointed_black_star:': [ 10036 ],
  ':snowflake:': [ 10052 ],
  ':sparkle:': [ 10055 ],
  ':question:': [ 10067 ],
  ':grey_question:': [ 10068 ],
  ':grey_exclamation:': [ 10069 ],
  ':exclamation:': [ 10071 ],
  ':heavy_heart_exclamation_mark_ornament:': [ 10083 ],
  ':heart_exclamation:': [ 10083 ],
  ':heart:': [ 10084 ],
  ':heavy_plus_sign:': [ 10133 ],
  ':heavy_minus_sign:': [ 10134 ],
  ':heavy_division_sign:': [ 10135 ],
  ':arrow_heading_up:': [ 10548 ],
  ':arrow_heading_down:': [ 10549 ],
  ':wavy_dash:': [ 12336 ],
  ':congratulations:': [ 12951 ],
  ':secret:': [ 12953 ],
  ':hash:': [ 35, 8419 ],
  ':keycap_asterisk:': [ 42, 8419 ],
  ':asterisk:': [ 42, 8419 ],
  ':zero:': [ 48, 8419 ],
  ':one:': [ 49, 8419 ],
  ':two:': [ 50, 8419 ],
  ':three:': [ 51, 8419 ],
  ':four:': [ 52, 8419 ],
  ':five:': [ 53, 8419 ],
  ':six:': [ 54, 8419 ],
  ':seven:': [ 55, 8419 ],
  ':eight:': [ 56, 8419 ],
  ':nine:': [ 57, 8419 ],
  ':copyright:': [ 169 ],
  ':registered:': [ 174 ],
  ':mahjong:': [ 126980 ],
  ':black_joker:': [ 127183 ],
  ':a:': [ 127344 ],
  ':b:': [ 127345 ],
  ':o2:': [ 127358 ],
  ':parking:': [ 127359 ],
  ':ab:': [ 127374 ],
  ':cl:': [ 127377 ],
  ':cool:': [ 127378 ],
  ':free:': [ 127379 ],
  ':id:': [ 127380 ],
  ':new:': [ 127381 ],
  ':ng:': [ 127382 ],
  ':ok:': [ 127383 ],
  ':sos:': [ 127384 ],
  ':up:': [ 127385 ],
  ':vs:': [ 127386 ],
  ':regional_indicator_a:': [ 127462 ],
  ':ac:': [ 127462, 127464 ],
  ':flag_ac:': [ 127462, 127464 ],
  ':ad:': [ 127462, 127465 ],
  ':flag_ad:': [ 127462, 127465 ],
  ':ae:': [ 127462, 127466 ],
  ':flag_ae:': [ 127462, 127466 ],
  ':af:': [ 127462, 127467 ],
  ':flag_af:': [ 127462, 127467 ],
  ':ag:': [ 127462, 127468 ],
  ':flag_ag:': [ 127462, 127468 ],
  ':ai:': [ 127462, 127470 ],
  ':flag_ai:': [ 127462, 127470 ],
  ':al:': [ 127462, 127473 ],
  ':flag_al:': [ 127462, 127473 ],
  ':am:': [ 127462, 127474 ],
  ':flag_am:': [ 127462, 127474 ],
  ':ao:': [ 127462, 127476 ],
  ':flag_ao:': [ 127462, 127476 ],
  ':aq:': [ 127462, 127478 ],
  ':flag_aq:': [ 127462, 127478 ],
  ':ar:': [ 127462, 127479 ],
  ':flag_ar:': [ 127462, 127479 ],
  ':as:': [ 127462, 127480 ],
  ':flag_as:': [ 127462, 127480 ],
  ':at:': [ 127462, 127481 ],
  ':flag_at:': [ 127462, 127481 ],
  ':au:': [ 127462, 127482 ],
  ':flag_au:': [ 127462, 127482 ],
  ':aw:': [ 127462, 127484 ],
  ':flag_aw:': [ 127462, 127484 ],
  ':ax:': [ 127462, 127485 ],
  ':flag_ax:': [ 127462, 127485 ],
  ':az:': [ 127462, 127487 ],
  ':flag_az:': [ 127462, 127487 ],
  ':regional_indicator_b:': [ 127463 ],
  ':ba:': [ 127463, 127462 ],
  ':flag_ba:': [ 127463, 127462 ],
  ':bb:': [ 127463, 127463 ],
  ':flag_bb:': [ 127463, 127463 ],
  ':bd:': [ 127463, 127465 ],
  ':flag_bd:': [ 127463, 127465 ],
  ':be:': [ 127463, 127466 ],
  ':flag_be:': [ 127463, 127466 ],
  ':bf:': [ 127463, 127467 ],
  ':flag_bf:': [ 127463, 127467 ],
  ':bg:': [ 127463, 127468 ],
  ':flag_bg:': [ 127463, 127468 ],
  ':bh:': [ 127463, 127469 ],
  ':flag_bh:': [ 127463, 127469 ],
  ':bi:': [ 127463, 127470 ],
  ':flag_bi:': [ 127463, 127470 ],
  ':bj:': [ 127463, 127471 ],
  ':flag_bj:': [ 127463, 127471 ],
  ':bl:': [ 127463, 127473 ],
  ':flag_bl:': [ 127463, 127473 ],
  ':bm:': [ 127463, 127474 ],
  ':flag_bm:': [ 127463, 127474 ],
  ':bn:': [ 127463, 127475 ],
  ':flag_bn:': [ 127463, 127475 ],
  ':bo:': [ 127463, 127476 ],
  ':flag_bo:': [ 127463, 127476 ],
  ':bq:': [ 127463, 127478 ],
  ':flag_bq:': [ 127463, 127478 ],
  ':br:': [ 127463, 127479 ],
  ':flag_br:': [ 127463, 127479 ],
  ':bs:': [ 127463, 127480 ],
  ':flag_bs:': [ 127463, 127480 ],
  ':bt:': [ 127463, 127481 ],
  ':flag_bt:': [ 127463, 127481 ],
  ':bv:': [ 127463, 127483 ],
  ':flag_bv:': [ 127463, 127483 ],
  ':bw:': [ 127463, 127484 ],
  ':flag_bw:': [ 127463, 127484 ],
  ':by:': [ 127463, 127486 ],
  ':flag_by:': [ 127463, 127486 ],
  ':bz:': [ 127463, 127487 ],
  ':flag_bz:': [ 127463, 127487 ],
  ':regional_indicator_c:': [ 127464 ],
  ':ca:': [ 127464, 127462 ],
  ':flag_ca:': [ 127464, 127462 ],
  ':cc:': [ 127464, 127464 ],
  ':flag_cc:': [ 127464, 127464 ],
  ':congo:': [ 127464, 127465 ],
  ':flag_cd:': [ 127464, 127465 ],
  ':cf:': [ 127464, 127467 ],
  ':flag_cf:': [ 127464, 127467 ],
  ':cg:': [ 127464, 127468 ],
  ':flag_cg:': [ 127464, 127468 ],
  ':ch:': [ 127464, 127469 ],
  ':flag_ch:': [ 127464, 127469 ],
  ':ci:': [ 127464, 127470 ],
  ':flag_ci:': [ 127464, 127470 ],
  ':ck:': [ 127464, 127472 ],
  ':flag_ck:': [ 127464, 127472 ],
  ':chile:': [ 127464, 127473 ],
  ':flag_cl:': [ 127464, 127473 ],
  ':cm:': [ 127464, 127474 ],
  ':flag_cm:': [ 127464, 127474 ],
  ':cn:': [ 127464, 127475 ],
  ':flag_cn:': [ 127464, 127475 ],
  ':co:': [ 127464, 127476 ],
  ':flag_co:': [ 127464, 127476 ],
  ':cp:': [ 127464, 127477 ],
  ':flag_cp:': [ 127464, 127477 ],
  ':cr:': [ 127464, 127479 ],
  ':flag_cr:': [ 127464, 127479 ],
  ':cu:': [ 127464, 127482 ],
  ':flag_cu:': [ 127464, 127482 ],
  ':cv:': [ 127464, 127483 ],
  ':flag_cv:': [ 127464, 127483 ],
  ':cw:': [ 127464, 127484 ],
  ':flag_cw:': [ 127464, 127484 ],
  ':cx:': [ 127464, 127485 ],
  ':flag_cx:': [ 127464, 127485 ],
  ':cy:': [ 127464, 127486 ],
  ':flag_cy:': [ 127464, 127486 ],
  ':cz:': [ 127464, 127487 ],
  ':flag_cz:': [ 127464, 127487 ],
  ':regional_indicator_d:': [ 127465 ],
  ':de:': [ 127465, 127466 ],
  ':flag_de:': [ 127465, 127466 ],
  ':dg:': [ 127465, 127468 ],
  ':flag_dg:': [ 127465, 127468 ],
  ':dj:': [ 127465, 127471 ],
  ':flag_dj:': [ 127465, 127471 ],
  ':dk:': [ 127465, 127472 ],
  ':flag_dk:': [ 127465, 127472 ],
  ':dm:': [ 127465, 127474 ],
  ':flag_dm:': [ 127465, 127474 ],
  ':do:': [ 127465, 127476 ],
  ':flag_do:': [ 127465, 127476 ],
  ':dz:': [ 127465, 127487 ],
  ':flag_dz:': [ 127465, 127487 ],
  ':regional_indicator_e:': [ 127466 ],
  ':ea:': [ 127466, 127462 ],
  ':flag_ea:': [ 127466, 127462 ],
  ':ec:': [ 127466, 127464 ],
  ':flag_ec:': [ 127466, 127464 ],
  ':ee:': [ 127466, 127466 ],
  ':flag_ee:': [ 127466, 127466 ],
  ':eg:': [ 127466, 127468 ],
  ':flag_eg:': [ 127466, 127468 ],
  ':eh:': [ 127466, 127469 ],
  ':flag_eh:': [ 127466, 127469 ],
  ':er:': [ 127466, 127479 ],
  ':flag_er:': [ 127466, 127479 ],
  ':es:': [ 127466, 127480 ],
  ':flag_es:': [ 127466, 127480 ],
  ':et:': [ 127466, 127481 ],
  ':flag_et:': [ 127466, 127481 ],
  ':eu:': [ 127466, 127482 ],
  ':flag_eu:': [ 127466, 127482 ],
  ':regional_indicator_f:': [ 127467 ],
  ':fi:': [ 127467, 127470 ],
  ':flag_fi:': [ 127467, 127470 ],
  ':fj:': [ 127467, 127471 ],
  ':flag_fj:': [ 127467, 127471 ],
  ':fk:': [ 127467, 127472 ],
  ':flag_fk:': [ 127467, 127472 ],
  ':fm:': [ 127467, 127474 ],
  ':flag_fm:': [ 127467, 127474 ],
  ':fo:': [ 127467, 127476 ],
  ':flag_fo:': [ 127467, 127476 ],
  ':fr:': [ 127467, 127479 ],
  ':flag_fr:': [ 127467, 127479 ],
  ':regional_indicator_g:': [ 127468 ],
  ':ga:': [ 127468, 127462 ],
  ':flag_ga:': [ 127468, 127462 ],
  ':gb:': [ 127468, 127463 ],
  ':flag_gb:': [ 127468, 127463 ],
  ':gd:': [ 127468, 127465 ],
  ':flag_gd:': [ 127468, 127465 ],
  ':ge:': [ 127468, 127466 ],
  ':flag_ge:': [ 127468, 127466 ],
  ':gf:': [ 127468, 127467 ],
  ':flag_gf:': [ 127468, 127467 ],
  ':gg:': [ 127468, 127468 ],
  ':flag_gg:': [ 127468, 127468 ],
  ':gh:': [ 127468, 127469 ],
  ':flag_gh:': [ 127468, 127469 ],
  ':gi:': [ 127468, 127470 ],
  ':flag_gi:': [ 127468, 127470 ],
  ':gl:': [ 127468, 127473 ],
  ':flag_gl:': [ 127468, 127473 ],
  ':gm:': [ 127468, 127474 ],
  ':flag_gm:': [ 127468, 127474 ],
  ':gn:': [ 127468, 127475 ],
  ':flag_gn:': [ 127468, 127475 ],
  ':gp:': [ 127468, 127477 ],
  ':flag_gp:': [ 127468, 127477 ],
  ':gq:': [ 127468, 127478 ],
  ':flag_gq:': [ 127468, 127478 ],
  ':gr:': [ 127468, 127479 ],
  ':flag_gr:': [ 127468, 127479 ],
  ':gs:': [ 127468, 127480 ],
  ':flag_gs:': [ 127468, 127480 ],
  ':gt:': [ 127468, 127481 ],
  ':flag_gt:': [ 127468, 127481 ],
  ':gu:': [ 127468, 127482 ],
  ':flag_gu:': [ 127468, 127482 ],
  ':gw:': [ 127468, 127484 ],
  ':flag_gw:': [ 127468, 127484 ],
  ':gy:': [ 127468, 127486 ],
  ':flag_gy:': [ 127468, 127486 ],
  ':regional_indicator_h:': [ 127469 ],
  ':hk:': [ 127469, 127472 ],
  ':flag_hk:': [ 127469, 127472 ],
  ':hm:': [ 127469, 127474 ],
  ':flag_hm:': [ 127469, 127474 ],
  ':hn:': [ 127469, 127475 ],
  ':flag_hn:': [ 127469, 127475 ],
  ':hr:': [ 127469, 127479 ],
  ':flag_hr:': [ 127469, 127479 ],
  ':ht:': [ 127469, 127481 ],
  ':flag_ht:': [ 127469, 127481 ],
  ':hu:': [ 127469, 127482 ],
  ':flag_hu:': [ 127469, 127482 ],
  ':regional_indicator_i:': [ 127470 ],
  ':ic:': [ 127470, 127464 ],
  ':flag_ic:': [ 127470, 127464 ],
  ':indonesia:': [ 127470, 127465 ],
  ':flag_id:': [ 127470, 127465 ],
  ':ie:': [ 127470, 127466 ],
  ':flag_ie:': [ 127470, 127466 ],
  ':il:': [ 127470, 127473 ],
  ':flag_il:': [ 127470, 127473 ],
  ':im:': [ 127470, 127474 ],
  ':flag_im:': [ 127470, 127474 ],
  ':in:': [ 127470, 127475 ],
  ':flag_in:': [ 127470, 127475 ],
  ':io:': [ 127470, 127476 ],
  ':flag_io:': [ 127470, 127476 ],
  ':iq:': [ 127470, 127478 ],
  ':flag_iq:': [ 127470, 127478 ],
  ':ir:': [ 127470, 127479 ],
  ':flag_ir:': [ 127470, 127479 ],
  ':is:': [ 127470, 127480 ],
  ':flag_is:': [ 127470, 127480 ],
  ':it:': [ 127470, 127481 ],
  ':flag_it:': [ 127470, 127481 ],
  ':regional_indicator_j:': [ 127471 ],
  ':je:': [ 127471, 127466 ],
  ':flag_je:': [ 127471, 127466 ],
  ':jm:': [ 127471, 127474 ],
  ':flag_jm:': [ 127471, 127474 ],
  ':jo:': [ 127471, 127476 ],
  ':flag_jo:': [ 127471, 127476 ],
  ':jp:': [ 127471, 127477 ],
  ':flag_jp:': [ 127471, 127477 ],
  ':regional_indicator_k:': [ 127472 ],
  ':ke:': [ 127472, 127466 ],
  ':flag_ke:': [ 127472, 127466 ],
  ':kg:': [ 127472, 127468 ],
  ':flag_kg:': [ 127472, 127468 ],
  ':kh:': [ 127472, 127469 ],
  ':flag_kh:': [ 127472, 127469 ],
  ':ki:': [ 127472, 127470 ],
  ':flag_ki:': [ 127472, 127470 ],
  ':km:': [ 127472, 127474 ],
  ':flag_km:': [ 127472, 127474 ],
  ':kn:': [ 127472, 127475 ],
  ':flag_kn:': [ 127472, 127475 ],
  ':kp:': [ 127472, 127477 ],
  ':flag_kp:': [ 127472, 127477 ],
  ':kr:': [ 127472, 127479 ],
  ':flag_kr:': [ 127472, 127479 ],
  ':kw:': [ 127472, 127484 ],
  ':flag_kw:': [ 127472, 127484 ],
  ':ky:': [ 127472, 127486 ],
  ':flag_ky:': [ 127472, 127486 ],
  ':kz:': [ 127472, 127487 ],
  ':flag_kz:': [ 127472, 127487 ],
  ':regional_indicator_l:': [ 127473 ],
  ':la:': [ 127473, 127462 ],
  ':flag_la:': [ 127473, 127462 ],
  ':lb:': [ 127473, 127463 ],
  ':flag_lb:': [ 127473, 127463 ],
  ':lc:': [ 127473, 127464 ],
  ':flag_lc:': [ 127473, 127464 ],
  ':li:': [ 127473, 127470 ],
  ':flag_li:': [ 127473, 127470 ],
  ':lk:': [ 127473, 127472 ],
  ':flag_lk:': [ 127473, 127472 ],
  ':lr:': [ 127473, 127479 ],
  ':flag_lr:': [ 127473, 127479 ],
  ':ls:': [ 127473, 127480 ],
  ':flag_ls:': [ 127473, 127480 ],
  ':lt:': [ 127473, 127481 ],
  ':flag_lt:': [ 127473, 127481 ],
  ':lu:': [ 127473, 127482 ],
  ':flag_lu:': [ 127473, 127482 ],
  ':lv:': [ 127473, 127483 ],
  ':flag_lv:': [ 127473, 127483 ],
  ':ly:': [ 127473, 127486 ],
  ':flag_ly:': [ 127473, 127486 ],
  ':regional_indicator_m:': [ 127474 ],
  ':ma:': [ 127474, 127462 ],
  ':flag_ma:': [ 127474, 127462 ],
  ':mc:': [ 127474, 127464 ],
  ':flag_mc:': [ 127474, 127464 ],
  ':md:': [ 127474, 127465 ],
  ':flag_md:': [ 127474, 127465 ],
  ':me:': [ 127474, 127466 ],
  ':flag_me:': [ 127474, 127466 ],
  ':mf:': [ 127474, 127467 ],
  ':flag_mf:': [ 127474, 127467 ],
  ':mg:': [ 127474, 127468 ],
  ':flag_mg:': [ 127474, 127468 ],
  ':mh:': [ 127474, 127469 ],
  ':flag_mh:': [ 127474, 127469 ],
  ':mk:': [ 127474, 127472 ],
  ':flag_mk:': [ 127474, 127472 ],
  ':ml:': [ 127474, 127473 ],
  ':flag_ml:': [ 127474, 127473 ],
  ':mm:': [ 127474, 127474 ],
  ':flag_mm:': [ 127474, 127474 ],
  ':mn:': [ 127474, 127475 ],
  ':flag_mn:': [ 127474, 127475 ],
  ':mo:': [ 127474, 127476 ],
  ':flag_mo:': [ 127474, 127476 ],
  ':mp:': [ 127474, 127477 ],
  ':flag_mp:': [ 127474, 127477 ],
  ':mq:': [ 127474, 127478 ],
  ':flag_mq:': [ 127474, 127478 ],
  ':mr:': [ 127474, 127479 ],
  ':flag_mr:': [ 127474, 127479 ],
  ':ms:': [ 127474, 127480 ],
  ':flag_ms:': [ 127474, 127480 ],
  ':mt:': [ 127474, 127481 ],
  ':flag_mt:': [ 127474, 127481 ],
  ':mu:': [ 127474, 127482 ],
  ':flag_mu:': [ 127474, 127482 ],
  ':mv:': [ 127474, 127483 ],
  ':flag_mv:': [ 127474, 127483 ],
  ':mw:': [ 127474, 127484 ],
  ':flag_mw:': [ 127474, 127484 ],
  ':mx:': [ 127474, 127485 ],
  ':flag_mx:': [ 127474, 127485 ],
  ':my:': [ 127474, 127486 ],
  ':flag_my:': [ 127474, 127486 ],
  ':mz:': [ 127474, 127487 ],
  ':flag_mz:': [ 127474, 127487 ],
  ':regional_indicator_n:': [ 127475 ],
  ':na:': [ 127475, 127462 ],
  ':flag_na:': [ 127475, 127462 ],
  ':nc:': [ 127475, 127464 ],
  ':flag_nc:': [ 127475, 127464 ],
  ':ne:': [ 127475, 127466 ],
  ':flag_ne:': [ 127475, 127466 ],
  ':nf:': [ 127475, 127467 ],
  ':flag_nf:': [ 127475, 127467 ],
  ':nigeria:': [ 127475, 127468 ],
  ':flag_ng:': [ 127475, 127468 ],
  ':ni:': [ 127475, 127470 ],
  ':flag_ni:': [ 127475, 127470 ],
  ':nl:': [ 127475, 127473 ],
  ':flag_nl:': [ 127475, 127473 ],
  ':no:': [ 127475, 127476 ],
  ':flag_no:': [ 127475, 127476 ],
  ':np:': [ 127475, 127477 ],
  ':flag_np:': [ 127475, 127477 ],
  ':nr:': [ 127475, 127479 ],
  ':flag_nr:': [ 127475, 127479 ],
  ':nu:': [ 127475, 127482 ],
  ':flag_nu:': [ 127475, 127482 ],
  ':nz:': [ 127475, 127487 ],
  ':flag_nz:': [ 127475, 127487 ],
  ':regional_indicator_o:': [ 127476 ],
  ':om:': [ 127476, 127474 ],
  ':flag_om:': [ 127476, 127474 ],
  ':regional_indicator_p:': [ 127477 ],
  ':pa:': [ 127477, 127462 ],
  ':flag_pa:': [ 127477, 127462 ],
  ':pe:': [ 127477, 127466 ],
  ':flag_pe:': [ 127477, 127466 ],
  ':pf:': [ 127477, 127467 ],
  ':flag_pf:': [ 127477, 127467 ],
  ':pg:': [ 127477, 127468 ],
  ':flag_pg:': [ 127477, 127468 ],
  ':ph:': [ 127477, 127469 ],
  ':flag_ph:': [ 127477, 127469 ],
  ':pk:': [ 127477, 127472 ],
  ':flag_pk:': [ 127477, 127472 ],
  ':pl:': [ 127477, 127473 ],
  ':flag_pl:': [ 127477, 127473 ],
  ':pm:': [ 127477, 127474 ],
  ':flag_pm:': [ 127477, 127474 ],
  ':pn:': [ 127477, 127475 ],
  ':flag_pn:': [ 127477, 127475 ],
  ':pr:': [ 127477, 127479 ],
  ':flag_pr:': [ 127477, 127479 ],
  ':ps:': [ 127477, 127480 ],
  ':flag_ps:': [ 127477, 127480 ],
  ':pt:': [ 127477, 127481 ],
  ':flag_pt:': [ 127477, 127481 ],
  ':pw:': [ 127477, 127484 ],
  ':flag_pw:': [ 127477, 127484 ],
  ':py:': [ 127477, 127486 ],
  ':flag_py:': [ 127477, 127486 ],
  ':regional_indicator_q:': [ 127478 ],
  ':qa:': [ 127478, 127462 ],
  ':flag_qa:': [ 127478, 127462 ],
  ':regional_indicator_r:': [ 127479 ],
  ':re:': [ 127479, 127466 ],
  ':flag_re:': [ 127479, 127466 ],
  ':ro:': [ 127479, 127476 ],
  ':flag_ro:': [ 127479, 127476 ],
  ':rs:': [ 127479, 127480 ],
  ':flag_rs:': [ 127479, 127480 ],
  ':ru:': [ 127479, 127482 ],
  ':flag_ru:': [ 127479, 127482 ],
  ':rw:': [ 127479, 127484 ],
  ':flag_rw:': [ 127479, 127484 ],
  ':regional_indicator_s:': [ 127480 ],
  ':saudiarabia:': [ 127480, 127462 ],
  ':saudi:': [ 127480, 127462 ],
  ':flag_sa:': [ 127480, 127462 ],
  ':sb:': [ 127480, 127463 ],
  ':flag_sb:': [ 127480, 127463 ],
  ':sc:': [ 127480, 127464 ],
  ':flag_sc:': [ 127480, 127464 ],
  ':sd:': [ 127480, 127465 ],
  ':flag_sd:': [ 127480, 127465 ],
  ':se:': [ 127480, 127466 ],
  ':flag_se:': [ 127480, 127466 ],
  ':sg:': [ 127480, 127468 ],
  ':flag_sg:': [ 127480, 127468 ],
  ':sh:': [ 127480, 127469 ],
  ':flag_sh:': [ 127480, 127469 ],
  ':si:': [ 127480, 127470 ],
  ':flag_si:': [ 127480, 127470 ],
  ':sj:': [ 127480, 127471 ],
  ':flag_sj:': [ 127480, 127471 ],
  ':sk:': [ 127480, 127472 ],
  ':flag_sk:': [ 127480, 127472 ],
  ':sl:': [ 127480, 127473 ],
  ':flag_sl:': [ 127480, 127473 ],
  ':sm:': [ 127480, 127474 ],
  ':flag_sm:': [ 127480, 127474 ],
  ':sn:': [ 127480, 127475 ],
  ':flag_sn:': [ 127480, 127475 ],
  ':so:': [ 127480, 127476 ],
  ':flag_so:': [ 127480, 127476 ],
  ':sr:': [ 127480, 127479 ],
  ':flag_sr:': [ 127480, 127479 ],
  ':ss:': [ 127480, 127480 ],
  ':flag_ss:': [ 127480, 127480 ],
  ':st:': [ 127480, 127481 ],
  ':flag_st:': [ 127480, 127481 ],
  ':sv:': [ 127480, 127483 ],
  ':flag_sv:': [ 127480, 127483 ],
  ':sx:': [ 127480, 127485 ],
  ':flag_sx:': [ 127480, 127485 ],
  ':sy:': [ 127480, 127486 ],
  ':flag_sy:': [ 127480, 127486 ],
  ':sz:': [ 127480, 127487 ],
  ':flag_sz:': [ 127480, 127487 ],
  ':regional_indicator_t:': [ 127481 ],
  ':ta:': [ 127481, 127462 ],
  ':flag_ta:': [ 127481, 127462 ],
  ':tc:': [ 127481, 127464 ],
  ':flag_tc:': [ 127481, 127464 ],
  ':td:': [ 127481, 127465 ],
  ':flag_td:': [ 127481, 127465 ],
  ':tf:': [ 127481, 127467 ],
  ':flag_tf:': [ 127481, 127467 ],
  ':tg:': [ 127481, 127468 ],
  ':flag_tg:': [ 127481, 127468 ],
  ':th:': [ 127481, 127469 ],
  ':flag_th:': [ 127481, 127469 ],
  ':tj:': [ 127481, 127471 ],
  ':flag_tj:': [ 127481, 127471 ],
  ':tk:': [ 127481, 127472 ],
  ':flag_tk:': [ 127481, 127472 ],
  ':tl:': [ 127481, 127473 ],
  ':flag_tl:': [ 127481, 127473 ],
  ':turkmenistan:': [ 127481, 127474 ],
  ':flag_tm:': [ 127481, 127474 ],
  ':tn:': [ 127481, 127475 ],
  ':flag_tn:': [ 127481, 127475 ],
  ':to:': [ 127481, 127476 ],
  ':flag_to:': [ 127481, 127476 ],
  ':tr:': [ 127481, 127479 ],
  ':flag_tr:': [ 127481, 127479 ],
  ':tt:': [ 127481, 127481 ],
  ':flag_tt:': [ 127481, 127481 ],
  ':tuvalu:': [ 127481, 127483 ],
  ':flag_tv:': [ 127481, 127483 ],
  ':tw:': [ 127481, 127484 ],
  ':flag_tw:': [ 127481, 127484 ],
  ':tz:': [ 127481, 127487 ],
  ':flag_tz:': [ 127481, 127487 ],
  ':regional_indicator_u:': [ 127482 ],
  ':ua:': [ 127482, 127462 ],
  ':flag_ua:': [ 127482, 127462 ],
  ':ug:': [ 127482, 127468 ],
  ':flag_ug:': [ 127482, 127468 ],
  ':um:': [ 127482, 127474 ],
  ':flag_um:': [ 127482, 127474 ],
  ':us:': [ 127482, 127480 ],
  ':flag_us:': [ 127482, 127480 ],
  ':uy:': [ 127482, 127486 ],
  ':flag_uy:': [ 127482, 127486 ],
  ':uz:': [ 127482, 127487 ],
  ':flag_uz:': [ 127482, 127487 ],
  ':regional_indicator_v:': [ 127483 ],
  ':va:': [ 127483, 127462 ],
  ':flag_va:': [ 127483, 127462 ],
  ':vc:': [ 127483, 127464 ],
  ':flag_vc:': [ 127483, 127464 ],
  ':ve:': [ 127483, 127466 ],
  ':flag_ve:': [ 127483, 127466 ],
  ':vg:': [ 127483, 127468 ],
  ':flag_vg:': [ 127483, 127468 ],
  ':vi:': [ 127483, 127470 ],
  ':flag_vi:': [ 127483, 127470 ],
  ':vn:': [ 127483, 127475 ],
  ':flag_vn:': [ 127483, 127475 ],
  ':vu:': [ 127483, 127482 ],
  ':flag_vu:': [ 127483, 127482 ],
  ':regional_indicator_w:': [ 127484 ],
  ':wf:': [ 127484, 127467 ],
  ':flag_wf:': [ 127484, 127467 ],
  ':ws:': [ 127484, 127480 ],
  ':flag_ws:': [ 127484, 127480 ],
  ':regional_indicator_x:': [ 127485 ],
  ':xk:': [ 127485, 127472 ],
  ':flag_xk:': [ 127485, 127472 ],
  ':regional_indicator_y:': [ 127486 ],
  ':ye:': [ 127486, 127466 ],
  ':flag_ye:': [ 127486, 127466 ],
  ':yt:': [ 127486, 127481 ],
  ':flag_yt:': [ 127486, 127481 ],
  ':regional_indicator_z:': [ 127487 ],
  ':za:': [ 127487, 127462 ],
  ':flag_za:': [ 127487, 127462 ],
  ':zm:': [ 127487, 127474 ],
  ':flag_zm:': [ 127487, 127474 ],
  ':zw:': [ 127487, 127484 ],
  ':flag_zw:': [ 127487, 127484 ],
  ':koko:': [ 127489 ],
  ':sa:': [ 127490 ],
  ':u7121:': [ 127514 ],
  ':u6307:': [ 127535 ],
  ':u7981:': [ 127538 ],
  ':u7a7a:': [ 127539 ],
  ':u5408:': [ 127540 ],
  ':u6e80:': [ 127541 ],
  ':u6709:': [ 127542 ],
  ':u6708:': [ 127543 ],
  ':u7533:': [ 127544 ],
  ':u5272:': [ 127545 ],
  ':u55b6:': [ 127546 ],
  ':ideograph_advantage:': [ 127568 ],
  ':accept:': [ 127569 ],
  ':cyclone:': [ 127744 ],
  ':foggy:': [ 127745 ],
  ':closed_umbrella:': [ 127746 ],
  ':night_with_stars:': [ 127747 ],
  ':sunrise_over_mountains:': [ 127748 ],
  ':sunrise:': [ 127749 ],
  ':city_dusk:': [ 127750 ],
  ':city_sunrise:': [ 127751 ],
  ':city_sunset:': [ 127751 ],
  ':rainbow:': [ 127752 ],
  ':bridge_at_night:': [ 127753 ],
  ':ocean:': [ 127754 ],
  ':volcano:': [ 127755 ],
  ':milky_way:': [ 127756 ],
  ':earth_africa:': [ 127757 ],
  ':earth_americas:': [ 127758 ],
  ':earth_asia:': [ 127759 ],
  ':globe_with_meridians:': [ 127760 ],
  ':new_moon:': [ 127761 ],
  ':waxing_crescent_moon:': [ 127762 ],
  ':first_quarter_moon:': [ 127763 ],
  ':waxing_gibbous_moon:': [ 127764 ],
  ':full_moon:': [ 127765 ],
  ':waning_gibbous_moon:': [ 127766 ],
  ':last_quarter_moon:': [ 127767 ],
  ':waning_crescent_moon:': [ 127768 ],
  ':crescent_moon:': [ 127769 ],
  ':new_moon_with_face:': [ 127770 ],
  ':first_quarter_moon_with_face:': [ 127771 ],
  ':last_quarter_moon_with_face:': [ 127772 ],
  ':full_moon_with_face:': [ 127773 ],
  ':sun_with_face:': [ 127774 ],
  ':star2:': [ 127775 ],
  ':stars:': [ 127776 ],
  ':thermometer:': [ 127777 ],
  ':white_sun_with_small_cloud:': [ 127780 ],
  ':white_sun_small_cloud:': [ 127780 ],
  ':white_sun_behind_cloud:': [ 127781 ],
  ':white_sun_cloud:': [ 127781 ],
  ':white_sun_behind_cloud_with_rain:': [ 127782 ],
  ':white_sun_rain_cloud:': [ 127782 ],
  ':cloud_with_rain:': [ 127783 ],
  ':cloud_rain:': [ 127783 ],
  ':cloud_with_snow:': [ 127784 ],
  ':cloud_snow:': [ 127784 ],
  ':cloud_with_lightning:': [ 127785 ],
  ':cloud_lightning:': [ 127785 ],
  ':cloud_with_tornado:': [ 127786 ],
  ':cloud_tornado:': [ 127786 ],
  ':fog:': [ 127787 ],
  ':wind_blowing_face:': [ 127788 ],
  ':hot_dog:': [ 127789 ],
  ':hotdog:': [ 127789 ],
  ':taco:': [ 127790 ],
  ':burrito:': [ 127791 ],
  ':chestnut:': [ 127792 ],
  ':seedling:': [ 127793 ],
  ':evergreen_tree:': [ 127794 ],
  ':deciduous_tree:': [ 127795 ],
  ':palm_tree:': [ 127796 ],
  ':cactus:': [ 127797 ],
  ':hot_pepper:': [ 127798 ],
  ':tulip:': [ 127799 ],
  ':cherry_blossom:': [ 127800 ],
  ':rose:': [ 127801 ],
  ':hibiscus:': [ 127802 ],
  ':sunflower:': [ 127803 ],
  ':blossom:': [ 127804 ],
  ':corn:': [ 127805 ],
  ':ear_of_rice:': [ 127806 ],
  ':herb:': [ 127807 ],
  ':four_leaf_clover:': [ 127808 ],
  ':maple_leaf:': [ 127809 ],
  ':fallen_leaf:': [ 127810 ],
  ':leaves:': [ 127811 ],
  ':mushroom:': [ 127812 ],
  ':tomato:': [ 127813 ],
  ':eggplant:': [ 127814 ],
  ':grapes:': [ 127815 ],
  ':melon:': [ 127816 ],
  ':watermelon:': [ 127817 ],
  ':tangerine:': [ 127818 ],
  ':lemon:': [ 127819 ],
  ':banana:': [ 127820 ],
  ':pineapple:': [ 127821 ],
  ':apple:': [ 127822 ],
  ':green_apple:': [ 127823 ],
  ':pear:': [ 127824 ],
  ':peach:': [ 127825 ],
  ':cherries:': [ 127826 ],
  ':strawberry:': [ 127827 ],
  ':hamburger:': [ 127828 ],
  ':pizza:': [ 127829 ],
  ':meat_on_bone:': [ 127830 ],
  ':poultry_leg:': [ 127831 ],
  ':rice_cracker:': [ 127832 ],
  ':rice_ball:': [ 127833 ],
  ':rice:': [ 127834 ],
  ':curry:': [ 127835 ],
  ':ramen:': [ 127836 ],
  ':spaghetti:': [ 127837 ],
  ':bread:': [ 127838 ],
  ':fries:': [ 127839 ],
  ':sweet_potato:': [ 127840 ],
  ':dango:': [ 127841 ],
  ':oden:': [ 127842 ],
  ':sushi:': [ 127843 ],
  ':fried_shrimp:': [ 127844 ],
  ':fish_cake:': [ 127845 ],
  ':icecream:': [ 127846 ],
  ':shaved_ice:': [ 127847 ],
  ':ice_cream:': [ 127848 ],
  ':doughnut:': [ 127849 ],
  ':cookie:': [ 127850 ],
  ':chocolate_bar:': [ 127851 ],
  ':candy:': [ 127852 ],
  ':lollipop:': [ 127853 ],
  ':pudding:': [ 127854 ],
  ':flan:': [ 127854 ],
  ':custard:': [ 127854 ],
  ':honey_pot:': [ 127855 ],
  ':cake:': [ 127856 ],
  ':bento:': [ 127857 ],
  ':stew:': [ 127858 ],
  ':cooking:': [ 127859 ],
  ':fork_and_knife:': [ 127860 ],
  ':tea:': [ 127861 ],
  ':sake:': [ 127862 ],
  ':wine_glass:': [ 127863 ],
  ':cocktail:': [ 127864 ],
  ':tropical_drink:': [ 127865 ],
  ':beer:': [ 127866 ],
  ':beers:': [ 127867 ],
  ':baby_bottle:': [ 127868 ],
  ':fork_and_knife_with_plate:': [ 127869 ],
  ':fork_knife_plate:': [ 127869 ],
  ':bottle_with_popping_cork:': [ 127870 ],
  ':champagne:': [ 127870 ],
  ':popcorn:': [ 127871 ],
  ':ribbon:': [ 127872 ],
  ':gift:': [ 127873 ],
  ':birthday:': [ 127874 ],
  ':jack_o_lantern:': [ 127875 ],
  ':christmas_tree:': [ 127876 ],
  ':santa:': [ 127877 ],
  ':santa_tone1:': [ 127877, 127995 ],
  ':santa_tone2:': [ 127877, 127996 ],
  ':santa_tone3:': [ 127877, 127997 ],
  ':santa_tone4:': [ 127877, 127998 ],
  ':santa_tone5:': [ 127877, 127999 ],
  ':fireworks:': [ 127878 ],
  ':sparkler:': [ 127879 ],
  ':balloon:': [ 127880 ],
  ':tada:': [ 127881 ],
  ':confetti_ball:': [ 127882 ],
  ':tanabata_tree:': [ 127883 ],
  ':crossed_flags:': [ 127884 ],
  ':bamboo:': [ 127885 ],
  ':dolls:': [ 127886 ],
  ':flags:': [ 127887 ],
  ':wind_chime:': [ 127888 ],
  ':rice_scene:': [ 127889 ],
  ':school_satchel:': [ 127890 ],
  ':mortar_board:': [ 127891 ],
  ':military_medal:': [ 127894 ],
  ':reminder_ribbon:': [ 127895 ],
  ':studio_microphone:': [ 127897 ],
  ':microphone2:': [ 127897 ],
  ':level_slider:': [ 127898 ],
  ':control_knobs:': [ 127899 ],
  ':film_frames:': [ 127902 ],
  ':admission_tickets:': [ 127903 ],
  ':tickets:': [ 127903 ],
  ':carousel_horse:': [ 127904 ],
  ':ferris_wheel:': [ 127905 ],
  ':roller_coaster:': [ 127906 ],
  ':fishing_pole_and_fish:': [ 127907 ],
  ':microphone:': [ 127908 ],
  ':movie_camera:': [ 127909 ],
  ':cinema:': [ 127910 ],
  ':headphones:': [ 127911 ],
  ':art:': [ 127912 ],
  ':tophat:': [ 127913 ],
  ':circus_tent:': [ 127914 ],
  ':ticket:': [ 127915 ],
  ':clapper:': [ 127916 ],
  ':performing_arts:': [ 127917 ],
  ':video_game:': [ 127918 ],
  ':dart:': [ 127919 ],
  ':slot_machine:': [ 127920 ],
  ':8ball:': [ 127921 ],
  ':game_die:': [ 127922 ],
  ':bowling:': [ 127923 ],
  ':flower_playing_cards:': [ 127924 ],
  ':musical_note:': [ 127925 ],
  ':notes:': [ 127926 ],
  ':saxophone:': [ 127927 ],
  ':guitar:': [ 127928 ],
  ':musical_keyboard:': [ 127929 ],
  ':trumpet:': [ 127930 ],
  ':violin:': [ 127931 ],
  ':musical_score:': [ 127932 ],
  ':running_shirt_with_sash:': [ 127933 ],
  ':tennis:': [ 127934 ],
  ':ski:': [ 127935 ],
  ':basketball:': [ 127936 ],
  ':checkered_flag:': [ 127937 ],
  ':snowboarder:': [ 127938 ],
  ':runner:': [ 127939 ],
  ':runner_tone1:': [ 127939, 127995 ],
  ':runner_tone2:': [ 127939, 127996 ],
  ':runner_tone3:': [ 127939, 127997 ],
  ':runner_tone4:': [ 127939, 127998 ],
  ':runner_tone5:': [ 127939, 127999 ],
  ':surfer:': [ 127940 ],
  ':surfer_tone1:': [ 127940, 127995 ],
  ':surfer_tone2:': [ 127940, 127996 ],
  ':surfer_tone3:': [ 127940, 127997 ],
  ':surfer_tone4:': [ 127940, 127998 ],
  ':surfer_tone5:': [ 127940, 127999 ],
  ':sports_medal:': [ 127941 ],
  ':medal:': [ 127941 ],
  ':trophy:': [ 127942 ],
  ':horse_racing:': [ 127943 ],
  ':horse_racing_tone1:': [ 127943, 127995 ],
  ':horse_racing_tone2:': [ 127943, 127996 ],
  ':horse_racing_tone3:': [ 127943, 127997 ],
  ':horse_racing_tone4:': [ 127943, 127998 ],
  ':horse_racing_tone5:': [ 127943, 127999 ],
  ':football:': [ 127944 ],
  ':rugby_football:': [ 127945 ],
  ':swimmer:': [ 127946 ],
  ':swimmer_tone1:': [ 127946, 127995 ],
  ':swimmer_tone2:': [ 127946, 127996 ],
  ':swimmer_tone3:': [ 127946, 127997 ],
  ':swimmer_tone4:': [ 127946, 127998 ],
  ':swimmer_tone5:': [ 127946, 127999 ],
  ':weight_lifter:': [ 127947 ],
  ':lifter:': [ 127947 ],
  ':weight_lifter_tone1:': [ 127947, 127995 ],
  ':lifter_tone1:': [ 127947, 127995 ],
  ':weight_lifter_tone2:': [ 127947, 127996 ],
  ':lifter_tone2:': [ 127947, 127996 ],
  ':weight_lifter_tone3:': [ 127947, 127997 ],
  ':lifter_tone3:': [ 127947, 127997 ],
  ':weight_lifter_tone4:': [ 127947, 127998 ],
  ':lifter_tone4:': [ 127947, 127998 ],
  ':weight_lifter_tone5:': [ 127947, 127999 ],
  ':lifter_tone5:': [ 127947, 127999 ],
  ':golfer:': [ 127948 ],
  ':racing_motorcycle:': [ 127949 ],
  ':motorcycle:': [ 127949 ],
  ':racing_car:': [ 127950 ],
  ':race_car:': [ 127950 ],
  ':cricket_bat_ball:': [ 127951 ],
  ':cricket:': [ 127951 ],
  ':volleyball:': [ 127952 ],
  ':field_hockey:': [ 127953 ],
  ':hockey:': [ 127954 ],
  ':table_tennis:': [ 127955 ],
  ':ping_pong:': [ 127955 ],
  ':snow_capped_mountain:': [ 127956 ],
  ':mountain_snow:': [ 127956 ],
  ':camping:': [ 127957 ],
  ':beach_with_umbrella:': [ 127958 ],
  ':beach:': [ 127958 ],
  ':building_construction:': [ 127959 ],
  ':construction_site:': [ 127959 ],
  ':house_buildings:': [ 127960 ],
  ':homes:': [ 127960 ],
  ':cityscape:': [ 127961 ],
  ':derelict_house_building:': [ 127962 ],
  ':house_abandoned:': [ 127962 ],
  ':classical_building:': [ 127963 ],
  ':desert:': [ 127964 ],
  ':desert_island:': [ 127965 ],
  ':island:': [ 127965 ],
  ':national_park:': [ 127966 ],
  ':park:': [ 127966 ],
  ':stadium:': [ 127967 ],
  ':house:': [ 127968 ],
  ':house_with_garden:': [ 127969 ],
  ':office:': [ 127970 ],
  ':post_office:': [ 127971 ],
  ':european_post_office:': [ 127972 ],
  ':hospital:': [ 127973 ],
  ':bank:': [ 127974 ],
  ':atm:': [ 127975 ],
  ':hotel:': [ 127976 ],
  ':love_hotel:': [ 127977 ],
  ':convenience_store:': [ 127978 ],
  ':school:': [ 127979 ],
  ':department_store:': [ 127980 ],
  ':factory:': [ 127981 ],
  ':izakaya_lantern:': [ 127982 ],
  ':japanese_castle:': [ 127983 ],
  ':european_castle:': [ 127984 ],
  ':waving_white_flag:': [ 127987 ],
  ':flag_white:': [ 127987 ],
  ':rainbow_flag:': [ 127987, 127752 ],
  ':gay_pride_flag:': [ 127987, 127752 ],
  ':waving_black_flag:': [ 127988 ],
  ':flag_black:': [ 127988 ],
  ':rosette:': [ 127989 ],
  ':label:': [ 127991 ],
  ':badminton:': [ 127992 ],
  ':archery:': [ 127993 ],
  ':bow_and_arrow:': [ 127993 ],
  ':amphora:': [ 127994 ],
  ':tone1:': [ 127995 ],
  ':tone2:': [ 127996 ],
  ':tone3:': [ 127997 ],
  ':tone4:': [ 127998 ],
  ':tone5:': [ 127999 ],
  ':rat:': [ 128000 ],
  ':mouse2:': [ 128001 ],
  ':ox:': [ 128002 ],
  ':water_buffalo:': [ 128003 ],
  ':cow2:': [ 128004 ],
  ':tiger2:': [ 128005 ],
  ':leopard:': [ 128006 ],
  ':rabbit2:': [ 128007 ],
  ':cat2:': [ 128008 ],
  ':dragon:': [ 128009 ],
  ':crocodile:': [ 128010 ],
  ':whale2:': [ 128011 ],
  ':snail:': [ 128012 ],
  ':snake:': [ 128013 ],
  ':racehorse:': [ 128014 ],
  ':ram:': [ 128015 ],
  ':goat:': [ 128016 ],
  ':sheep:': [ 128017 ],
  ':monkey:': [ 128018 ],
  ':rooster:': [ 128019 ],
  ':chicken:': [ 128020 ],
  ':dog2:': [ 128021 ],
  ':pig2:': [ 128022 ],
  ':boar:': [ 128023 ],
  ':elephant:': [ 128024 ],
  ':octopus:': [ 128025 ],
  ':shell:': [ 128026 ],
  ':bug:': [ 128027 ],
  ':ant:': [ 128028 ],
  ':bee:': [ 128029 ],
  ':beetle:': [ 128030 ],
  ':fish:': [ 128031 ],
  ':tropical_fish:': [ 128032 ],
  ':blowfish:': [ 128033 ],
  ':turtle:': [ 128034 ],
  ':hatching_chick:': [ 128035 ],
  ':baby_chick:': [ 128036 ],
  ':hatched_chick:': [ 128037 ],
  ':bird:': [ 128038 ],
  ':penguin:': [ 128039 ],
  ':koala:': [ 128040 ],
  ':poodle:': [ 128041 ],
  ':dromedary_camel:': [ 128042 ],
  ':camel:': [ 128043 ],
  ':dolphin:': [ 128044 ],
  ':mouse:': [ 128045 ],
  ':cow:': [ 128046 ],
  ':tiger:': [ 128047 ],
  ':rabbit:': [ 128048 ],
  ':cat:': [ 128049 ],
  ':dragon_face:': [ 128050 ],
  ':whale:': [ 128051 ],
  ':horse:': [ 128052 ],
  ':monkey_face:': [ 128053 ],
  ':dog:': [ 128054 ],
  ':pig:': [ 128055 ],
  ':frog:': [ 128056 ],
  ':hamster:': [ 128057 ],
  ':wolf:': [ 128058 ],
  ':bear:': [ 128059 ],
  ':panda_face:': [ 128060 ],
  ':pig_nose:': [ 128061 ],
  ':paw_prints:': [ 128062 ],
  ':feet:': [ 128062 ],
  ':chipmunk:': [ 128063 ],
  ':eyes:': [ 128064 ],
  ':eye:': [ 128065 ],
  ':eye_in_speech_bubble:': [ 128065, 128488 ],
  ':ear:': [ 128066 ],
  ':ear_tone1:': [ 128066, 127995 ],
  ':ear_tone2:': [ 128066, 127996 ],
  ':ear_tone3:': [ 128066, 127997 ],
  ':ear_tone4:': [ 128066, 127998 ],
  ':ear_tone5:': [ 128066, 127999 ],
  ':nose:': [ 128067 ],
  ':nose_tone1:': [ 128067, 127995 ],
  ':nose_tone2:': [ 128067, 127996 ],
  ':nose_tone3:': [ 128067, 127997 ],
  ':nose_tone4:': [ 128067, 127998 ],
  ':nose_tone5:': [ 128067, 127999 ],
  ':lips:': [ 128068 ],
  ':tongue:': [ 128069 ],
  ':point_up_2:': [ 128070 ],
  ':point_up_2_tone1:': [ 128070, 127995 ],
  ':point_up_2_tone2:': [ 128070, 127996 ],
  ':point_up_2_tone3:': [ 128070, 127997 ],
  ':point_up_2_tone4:': [ 128070, 127998 ],
  ':point_up_2_tone5:': [ 128070, 127999 ],
  ':point_down:': [ 128071 ],
  ':point_down_tone1:': [ 128071, 127995 ],
  ':point_down_tone2:': [ 128071, 127996 ],
  ':point_down_tone3:': [ 128071, 127997 ],
  ':point_down_tone4:': [ 128071, 127998 ],
  ':point_down_tone5:': [ 128071, 127999 ],
  ':point_left:': [ 128072 ],
  ':point_left_tone1:': [ 128072, 127995 ],
  ':point_left_tone2:': [ 128072, 127996 ],
  ':point_left_tone3:': [ 128072, 127997 ],
  ':point_left_tone4:': [ 128072, 127998 ],
  ':point_left_tone5:': [ 128072, 127999 ],
  ':point_right:': [ 128073 ],
  ':point_right_tone1:': [ 128073, 127995 ],
  ':point_right_tone2:': [ 128073, 127996 ],
  ':point_right_tone3:': [ 128073, 127997 ],
  ':point_right_tone4:': [ 128073, 127998 ],
  ':point_right_tone5:': [ 128073, 127999 ],
  ':punch:': [ 128074 ],
  ':punch_tone1:': [ 128074, 127995 ],
  ':punch_tone2:': [ 128074, 127996 ],
  ':punch_tone3:': [ 128074, 127997 ],
  ':punch_tone4:': [ 128074, 127998 ],
  ':punch_tone5:': [ 128074, 127999 ],
  ':wave:': [ 128075 ],
  ':wave_tone1:': [ 128075, 127995 ],
  ':wave_tone2:': [ 128075, 127996 ],
  ':wave_tone3:': [ 128075, 127997 ],
  ':wave_tone4:': [ 128075, 127998 ],
  ':wave_tone5:': [ 128075, 127999 ],
  ':ok_hand:': [ 128076 ],
  ':ok_hand_tone1:': [ 128076, 127995 ],
  ':ok_hand_tone2:': [ 128076, 127996 ],
  ':ok_hand_tone3:': [ 128076, 127997 ],
  ':ok_hand_tone4:': [ 128076, 127998 ],
  ':ok_hand_tone5:': [ 128076, 127999 ],
  ':+1:': [ 128077 ],
  ':thumbup:': [ 128077 ],
  ':thumbsup:': [ 128077 ],
  ':+1_tone1:': [ 128077, 127995 ],
  ':thumbup_tone1:': [ 128077, 127995 ],
  ':thumbsup_tone1:': [ 128077, 127995 ],
  ':+1_tone2:': [ 128077, 127996 ],
  ':thumbup_tone2:': [ 128077, 127996 ],
  ':thumbsup_tone2:': [ 128077, 127996 ],
  ':+1_tone3:': [ 128077, 127997 ],
  ':thumbup_tone3:': [ 128077, 127997 ],
  ':thumbsup_tone3:': [ 128077, 127997 ],
  ':+1_tone4:': [ 128077, 127998 ],
  ':thumbup_tone4:': [ 128077, 127998 ],
  ':thumbsup_tone4:': [ 128077, 127998 ],
  ':+1_tone5:': [ 128077, 127999 ],
  ':thumbup_tone5:': [ 128077, 127999 ],
  ':thumbsup_tone5:': [ 128077, 127999 ],
  ':-1:': [ 128078 ],
  ':thumbdown:': [ 128078 ],
  ':thumbsdown:': [ 128078 ],
  ':-1_tone1:': [ 128078, 127995 ],
  ':thumbdown_tone1:': [ 128078, 127995 ],
  ':thumbsdown_tone1:': [ 128078, 127995 ],
  ':-1_tone2:': [ 128078, 127996 ],
  ':thumbdown_tone2:': [ 128078, 127996 ],
  ':thumbsdown_tone2:': [ 128078, 127996 ],
  ':-1_tone3:': [ 128078, 127997 ],
  ':thumbdown_tone3:': [ 128078, 127997 ],
  ':thumbsdown_tone3:': [ 128078, 127997 ],
  ':-1_tone4:': [ 128078, 127998 ],
  ':thumbdown_tone4:': [ 128078, 127998 ],
  ':thumbsdown_tone4:': [ 128078, 127998 ],
  ':-1_tone5:': [ 128078, 127999 ],
  ':thumbdown_tone5:': [ 128078, 127999 ],
  ':thumbsdown_tone5:': [ 128078, 127999 ],
  ':clap:': [ 128079 ],
  ':clap_tone1:': [ 128079, 127995 ],
  ':clap_tone2:': [ 128079, 127996 ],
  ':clap_tone3:': [ 128079, 127997 ],
  ':clap_tone4:': [ 128079, 127998 ],
  ':clap_tone5:': [ 128079, 127999 ],
  ':open_hands:': [ 128080 ],
  ':open_hands_tone1:': [ 128080, 127995 ],
  ':open_hands_tone2:': [ 128080, 127996 ],
  ':open_hands_tone3:': [ 128080, 127997 ],
  ':open_hands_tone4:': [ 128080, 127998 ],
  ':open_hands_tone5:': [ 128080, 127999 ],
  ':crown:': [ 128081 ],
  ':womans_hat:': [ 128082 ],
  ':eyeglasses:': [ 128083 ],
  ':necktie:': [ 128084 ],
  ':shirt:': [ 128085 ],
  ':jeans:': [ 128086 ],
  ':dress:': [ 128087 ],
  ':kimono:': [ 128088 ],
  ':bikini:': [ 128089 ],
  ':womans_clothes:': [ 128090 ],
  ':purse:': [ 128091 ],
  ':handbag:': [ 128092 ],
  ':pouch:': [ 128093 ],
  ':mans_shoe:': [ 128094 ],
  ':athletic_shoe:': [ 128095 ],
  ':high_heel:': [ 128096 ],
  ':sandal:': [ 128097 ],
  ':boot:': [ 128098 ],
  ':footprints:': [ 128099 ],
  ':bust_in_silhouette:': [ 128100 ],
  ':busts_in_silhouette:': [ 128101 ],
  ':boy:': [ 128102 ],
  ':boy_tone1:': [ 128102, 127995 ],
  ':boy_tone2:': [ 128102, 127996 ],
  ':boy_tone3:': [ 128102, 127997 ],
  ':boy_tone4:': [ 128102, 127998 ],
  ':boy_tone5:': [ 128102, 127999 ],
  ':girl:': [ 128103 ],
  ':girl_tone1:': [ 128103, 127995 ],
  ':girl_tone2:': [ 128103, 127996 ],
  ':girl_tone3:': [ 128103, 127997 ],
  ':girl_tone4:': [ 128103, 127998 ],
  ':girl_tone5:': [ 128103, 127999 ],
  ':man:': [ 128104 ],
  ':man_tone1:': [ 128104, 127995 ],
  ':man_tone2:': [ 128104, 127996 ],
  ':man_tone3:': [ 128104, 127997 ],
  ':man_tone4:': [ 128104, 127998 ],
  ':man_tone5:': [ 128104, 127999 ],
  ':family_mmb:': [ 128104, 128104, 128102 ],
  ':family_mmbb:': [ 128104, 128104, 128102, 128102 ],
  ':family_mmg:': [ 128104, 128104, 128103 ],
  ':family_mmgb:': [ 128104, 128104, 128103, 128102 ],
  ':family_mmgg:': [ 128104, 128104, 128103, 128103 ],
  ':family_mwbb:': [ 128104, 128105, 128102, 128102 ],
  ':family_mwg:': [ 128104, 128105, 128103 ],
  ':family_mwgb:': [ 128104, 128105, 128103, 128102 ],
  ':family_mwgg:': [ 128104, 128105, 128103, 128103 ],
  ':couple_with_heart_mm:': [ 128104, 10084, 128104 ],
  ':couple_mm:': [ 128104, 10084, 128104 ],
  ':couplekiss_mm:': [ 128104, 10084, 128139, 128104 ],
  ':kiss_mm:': [ 128104, 10084, 128139, 128104 ],
  ':woman:': [ 128105 ],
  ':woman_tone1:': [ 128105, 127995 ],
  ':woman_tone2:': [ 128105, 127996 ],
  ':woman_tone3:': [ 128105, 127997 ],
  ':woman_tone4:': [ 128105, 127998 ],
  ':woman_tone5:': [ 128105, 127999 ],
  ':family_wwb:': [ 128105, 128105, 128102 ],
  ':family_wwbb:': [ 128105, 128105, 128102, 128102 ],
  ':family_wwg:': [ 128105, 128105, 128103 ],
  ':family_wwgb:': [ 128105, 128105, 128103, 128102 ],
  ':family_wwgg:': [ 128105, 128105, 128103, 128103 ],
  ':couple_with_heart_ww:': [ 128105, 10084, 128105 ],
  ':couple_ww:': [ 128105, 10084, 128105 ],
  ':couplekiss_ww:': [ 128105, 10084, 128139, 128105 ],
  ':kiss_ww:': [ 128105, 10084, 128139, 128105 ],
  ':family:': [ 128106 ],
  ':couple:': [ 128107 ],
  ':two_men_holding_hands:': [ 128108 ],
  ':two_women_holding_hands:': [ 128109 ],
  ':cop:': [ 128110 ],
  ':cop_tone1:': [ 128110, 127995 ],
  ':cop_tone2:': [ 128110, 127996 ],
  ':cop_tone3:': [ 128110, 127997 ],
  ':cop_tone4:': [ 128110, 127998 ],
  ':cop_tone5:': [ 128110, 127999 ],
  ':dancers:': [ 128111 ],
  ':bride_with_veil:': [ 128112 ],
  ':bride_with_veil_tone1:': [ 128112, 127995 ],
  ':bride_with_veil_tone2:': [ 128112, 127996 ],
  ':bride_with_veil_tone3:': [ 128112, 127997 ],
  ':bride_with_veil_tone4:': [ 128112, 127998 ],
  ':bride_with_veil_tone5:': [ 128112, 127999 ],
  ':person_with_blond_hair:': [ 128113 ],
  ':person_with_blond_hair_tone1:': [ 128113, 127995 ],
  ':person_with_blond_hair_tone2:': [ 128113, 127996 ],
  ':person_with_blond_hair_tone3:': [ 128113, 127997 ],
  ':person_with_blond_hair_tone4:': [ 128113, 127998 ],
  ':person_with_blond_hair_tone5:': [ 128113, 127999 ],
  ':man_with_gua_pi_mao:': [ 128114 ],
  ':man_with_gua_pi_mao_tone1:': [ 128114, 127995 ],
  ':man_with_gua_pi_mao_tone2:': [ 128114, 127996 ],
  ':man_with_gua_pi_mao_tone3:': [ 128114, 127997 ],
  ':man_with_gua_pi_mao_tone4:': [ 128114, 127998 ],
  ':man_with_gua_pi_mao_tone5:': [ 128114, 127999 ],
  ':man_with_turban:': [ 128115 ],
  ':man_with_turban_tone1:': [ 128115, 127995 ],
  ':man_with_turban_tone2:': [ 128115, 127996 ],
  ':man_with_turban_tone3:': [ 128115, 127997 ],
  ':man_with_turban_tone4:': [ 128115, 127998 ],
  ':man_with_turban_tone5:': [ 128115, 127999 ],
  ':older_man:': [ 128116 ],
  ':older_man_tone1:': [ 128116, 127995 ],
  ':older_man_tone2:': [ 128116, 127996 ],
  ':older_man_tone3:': [ 128116, 127997 ],
  ':older_man_tone4:': [ 128116, 127998 ],
  ':older_man_tone5:': [ 128116, 127999 ],
  ':grandma:': [ 128117 ],
  ':older_woman:': [ 128117 ],
  ':grandma_tone1:': [ 128117, 127995 ],
  ':older_woman_tone1:': [ 128117, 127995 ],
  ':grandma_tone2:': [ 128117, 127996 ],
  ':older_woman_tone2:': [ 128117, 127996 ],
  ':grandma_tone3:': [ 128117, 127997 ],
  ':older_woman_tone3:': [ 128117, 127997 ],
  ':grandma_tone4:': [ 128117, 127998 ],
  ':older_woman_tone4:': [ 128117, 127998 ],
  ':grandma_tone5:': [ 128117, 127999 ],
  ':older_woman_tone5:': [ 128117, 127999 ],
  ':baby:': [ 128118 ],
  ':baby_tone1:': [ 128118, 127995 ],
  ':baby_tone2:': [ 128118, 127996 ],
  ':baby_tone3:': [ 128118, 127997 ],
  ':baby_tone4:': [ 128118, 127998 ],
  ':baby_tone5:': [ 128118, 127999 ],
  ':construction_worker:': [ 128119 ],
  ':construction_worker_tone1:': [ 128119, 127995 ],
  ':construction_worker_tone2:': [ 128119, 127996 ],
  ':construction_worker_tone3:': [ 128119, 127997 ],
  ':construction_worker_tone4:': [ 128119, 127998 ],
  ':construction_worker_tone5:': [ 128119, 127999 ],
  ':princess:': [ 128120 ],
  ':princess_tone1:': [ 128120, 127995 ],
  ':princess_tone2:': [ 128120, 127996 ],
  ':princess_tone3:': [ 128120, 127997 ],
  ':princess_tone4:': [ 128120, 127998 ],
  ':princess_tone5:': [ 128120, 127999 ],
  ':japanese_ogre:': [ 128121 ],
  ':japanese_goblin:': [ 128122 ],
  ':ghost:': [ 128123 ],
  ':angel:': [ 128124 ],
  ':angel_tone1:': [ 128124, 127995 ],
  ':angel_tone2:': [ 128124, 127996 ],
  ':angel_tone3:': [ 128124, 127997 ],
  ':angel_tone4:': [ 128124, 127998 ],
  ':angel_tone5:': [ 128124, 127999 ],
  ':alien:': [ 128125 ],
  ':space_invader:': [ 128126 ],
  ':imp:': [ 128127 ],
  ':skeleton:': [ 128128 ],
  ':skull:': [ 128128 ],
  ':information_desk_person:': [ 128129 ],
  ':information_desk_person_tone1:': [ 128129, 127995 ],
  ':information_desk_person_tone2:': [ 128129, 127996 ],
  ':information_desk_person_tone3:': [ 128129, 127997 ],
  ':information_desk_person_tone4:': [ 128129, 127998 ],
  ':information_desk_person_tone5:': [ 128129, 127999 ],
  ':guardsman:': [ 128130 ],
  ':guardsman_tone1:': [ 128130, 127995 ],
  ':guardsman_tone2:': [ 128130, 127996 ],
  ':guardsman_tone3:': [ 128130, 127997 ],
  ':guardsman_tone4:': [ 128130, 127998 ],
  ':guardsman_tone5:': [ 128130, 127999 ],
  ':dancer:': [ 128131 ],
  ':dancer_tone1:': [ 128131, 127995 ],
  ':dancer_tone2:': [ 128131, 127996 ],
  ':dancer_tone3:': [ 128131, 127997 ],
  ':dancer_tone4:': [ 128131, 127998 ],
  ':dancer_tone5:': [ 128131, 127999 ],
  ':lipstick:': [ 128132 ],
  ':nail_care:': [ 128133 ],
  ':nail_care_tone1:': [ 128133, 127995 ],
  ':nail_care_tone2:': [ 128133, 127996 ],
  ':nail_care_tone3:': [ 128133, 127997 ],
  ':nail_care_tone4:': [ 128133, 127998 ],
  ':nail_care_tone5:': [ 128133, 127999 ],
  ':massage:': [ 128134 ],
  ':massage_tone1:': [ 128134, 127995 ],
  ':massage_tone2:': [ 128134, 127996 ],
  ':massage_tone3:': [ 128134, 127997 ],
  ':massage_tone4:': [ 128134, 127998 ],
  ':massage_tone5:': [ 128134, 127999 ],
  ':haircut:': [ 128135 ],
  ':haircut_tone1:': [ 128135, 127995 ],
  ':haircut_tone2:': [ 128135, 127996 ],
  ':haircut_tone3:': [ 128135, 127997 ],
  ':haircut_tone4:': [ 128135, 127998 ],
  ':haircut_tone5:': [ 128135, 127999 ],
  ':barber:': [ 128136 ],
  ':syringe:': [ 128137 ],
  ':pill:': [ 128138 ],
  ':kiss:': [ 128139 ],
  ':love_letter:': [ 128140 ],
  ':ring:': [ 128141 ],
  ':gem:': [ 128142 ],
  ':couplekiss:': [ 128143 ],
  ':bouquet:': [ 128144 ],
  ':couple_with_heart:': [ 128145 ],
  ':wedding:': [ 128146 ],
  ':heartbeat:': [ 128147 ],
  ':broken_heart:': [ 128148 ],
  ':two_hearts:': [ 128149 ],
  ':sparkling_heart:': [ 128150 ],
  ':heartpulse:': [ 128151 ],
  ':cupid:': [ 128152 ],
  ':blue_heart:': [ 128153 ],
  ':green_heart:': [ 128154 ],
  ':yellow_heart:': [ 128155 ],
  ':purple_heart:': [ 128156 ],
  ':gift_heart:': [ 128157 ],
  ':revolving_hearts:': [ 128158 ],
  ':heart_decoration:': [ 128159 ],
  ':diamond_shape_with_a_dot_inside:': [ 128160 ],
  ':bulb:': [ 128161 ],
  ':anger:': [ 128162 ],
  ':bomb:': [ 128163 ],
  ':zzz:': [ 128164 ],
  ':boom:': [ 128165 ],
  ':sweat_drops:': [ 128166 ],
  ':droplet:': [ 128167 ],
  ':dash:': [ 128168 ],
  ':shit:': [ 128169 ],
  ':hankey:': [ 128169 ],
  ':poo:': [ 128169 ],
  ':poop:': [ 128169 ],
  ':muscle:': [ 128170 ],
  ':muscle_tone1:': [ 128170, 127995 ],
  ':muscle_tone2:': [ 128170, 127996 ],
  ':muscle_tone3:': [ 128170, 127997 ],
  ':muscle_tone4:': [ 128170, 127998 ],
  ':muscle_tone5:': [ 128170, 127999 ],
  ':dizzy:': [ 128171 ],
  ':speech_balloon:': [ 128172 ],
  ':thought_balloon:': [ 128173 ],
  ':white_flower:': [ 128174 ],
  ':100:': [ 128175 ],
  ':moneybag:': [ 128176 ],
  ':currency_exchange:': [ 128177 ],
  ':heavy_dollar_sign:': [ 128178 ],
  ':credit_card:': [ 128179 ],
  ':yen:': [ 128180 ],
  ':dollar:': [ 128181 ],
  ':euro:': [ 128182 ],
  ':pound:': [ 128183 ],
  ':money_with_wings:': [ 128184 ],
  ':chart:': [ 128185 ],
  ':seat:': [ 128186 ],
  ':computer:': [ 128187 ],
  ':briefcase:': [ 128188 ],
  ':minidisc:': [ 128189 ],
  ':floppy_disk:': [ 128190 ],
  ':cd:': [ 128191 ],
  ':dvd:': [ 128192 ],
  ':file_folder:': [ 128193 ],
  ':open_file_folder:': [ 128194 ],
  ':page_with_curl:': [ 128195 ],
  ':page_facing_up:': [ 128196 ],
  ':date:': [ 128197 ],
  ':calendar:': [ 128198 ],
  ':card_index:': [ 128199 ],
  ':chart_with_upwards_trend:': [ 128200 ],
  ':chart_with_downwards_trend:': [ 128201 ],
  ':bar_chart:': [ 128202 ],
  ':clipboard:': [ 128203 ],
  ':pushpin:': [ 128204 ],
  ':round_pushpin:': [ 128205 ],
  ':paperclip:': [ 128206 ],
  ':straight_ruler:': [ 128207 ],
  ':triangular_ruler:': [ 128208 ],
  ':bookmark_tabs:': [ 128209 ],
  ':ledger:': [ 128210 ],
  ':notebook:': [ 128211 ],
  ':notebook_with_decorative_cover:': [ 128212 ],
  ':closed_book:': [ 128213 ],
  ':book:': [ 128214 ],
  ':green_book:': [ 128215 ],
  ':blue_book:': [ 128216 ],
  ':orange_book:': [ 128217 ],
  ':books:': [ 128218 ],
  ':name_badge:': [ 128219 ],
  ':scroll:': [ 128220 ],
  ':pencil:': [ 128221 ],
  ':telephone_receiver:': [ 128222 ],
  ':pager:': [ 128223 ],
  ':fax:': [ 128224 ],
  ':satellite:': [ 128225 ],
  ':loudspeaker:': [ 128226 ],
  ':mega:': [ 128227 ],
  ':outbox_tray:': [ 128228 ],
  ':inbox_tray:': [ 128229 ],
  ':package:': [ 128230 ],
  ':email:': [ 128231 ],
  ':e-mail:': [ 128231 ],
  ':incoming_envelope:': [ 128232 ],
  ':envelope_with_arrow:': [ 128233 ],
  ':mailbox_closed:': [ 128234 ],
  ':mailbox:': [ 128235 ],
  ':mailbox_with_mail:': [ 128236 ],
  ':mailbox_with_no_mail:': [ 128237 ],
  ':postbox:': [ 128238 ],
  ':postal_horn:': [ 128239 ],
  ':newspaper:': [ 128240 ],
  ':iphone:': [ 128241 ],
  ':calling:': [ 128242 ],
  ':vibration_mode:': [ 128243 ],
  ':mobile_phone_off:': [ 128244 ],
  ':no_mobile_phones:': [ 128245 ],
  ':signal_strength:': [ 128246 ],
  ':camera:': [ 128247 ],
  ':camera_with_flash:': [ 128248 ],
  ':video_camera:': [ 128249 ],
  ':tv:': [ 128250 ],
  ':radio:': [ 128251 ],
  ':vhs:': [ 128252 ],
  ':film_projector:': [ 128253 ],
  ':projector:': [ 128253 ],
  ':prayer_beads:': [ 128255 ],
  ':twisted_rightwards_arrows:': [ 128256 ],
  ':repeat:': [ 128257 ],
  ':repeat_one:': [ 128258 ],
  ':arrows_clockwise:': [ 128259 ],
  ':arrows_counterclockwise:': [ 128260 ],
  ':low_brightness:': [ 128261 ],
  ':high_brightness:': [ 128262 ],
  ':mute:': [ 128263 ],
  ':speaker:': [ 128264 ],
  ':sound:': [ 128265 ],
  ':loud_sound:': [ 128266 ],
  ':battery:': [ 128267 ],
  ':electric_plug:': [ 128268 ],
  ':mag:': [ 128269 ],
  ':mag_right:': [ 128270 ],
  ':lock_with_ink_pen:': [ 128271 ],
  ':closed_lock_with_key:': [ 128272 ],
  ':key:': [ 128273 ],
  ':lock:': [ 128274 ],
  ':unlock:': [ 128275 ],
  ':bell:': [ 128276 ],
  ':no_bell:': [ 128277 ],
  ':bookmark:': [ 128278 ],
  ':link:': [ 128279 ],
  ':radio_button:': [ 128280 ],
  ':back:': [ 128281 ],
  ':end:': [ 128282 ],
  ':on:': [ 128283 ],
  ':soon:': [ 128284 ],
  ':top:': [ 128285 ],
  ':underage:': [ 128286 ],
  ':keycap_ten:': [ 128287 ],
  ':capital_abcd:': [ 128288 ],
  ':abcd:': [ 128289 ],
  ':1234:': [ 128290 ],
  ':symbols:': [ 128291 ],
  ':abc:': [ 128292 ],
  ':flame:': [ 128293 ],
  ':fire:': [ 128293 ],
  ':flashlight:': [ 128294 ],
  ':wrench:': [ 128295 ],
  ':hammer:': [ 128296 ],
  ':nut_and_bolt:': [ 128297 ],
  ':knife:': [ 128298 ],
  ':gun:': [ 128299 ],
  ':microscope:': [ 128300 ],
  ':telescope:': [ 128301 ],
  ':crystal_ball:': [ 128302 ],
  ':six_pointed_star:': [ 128303 ],
  ':beginner:': [ 128304 ],
  ':trident:': [ 128305 ],
  ':black_square_button:': [ 128306 ],
  ':white_square_button:': [ 128307 ],
  ':red_circle:': [ 128308 ],
  ':large_blue_circle:': [ 128309 ],
  ':large_orange_diamond:': [ 128310 ],
  ':large_blue_diamond:': [ 128311 ],
  ':small_orange_diamond:': [ 128312 ],
  ':small_blue_diamond:': [ 128313 ],
  ':small_red_triangle:': [ 128314 ],
  ':small_red_triangle_down:': [ 128315 ],
  ':arrow_up_small:': [ 128316 ],
  ':arrow_down_small:': [ 128317 ],
  ':om_symbol:': [ 128329 ],
  ':dove_of_peace:': [ 128330 ],
  ':dove:': [ 128330 ],
  ':kaaba:': [ 128331 ],
  ':mosque:': [ 128332 ],
  ':synagogue:': [ 128333 ],
  ':menorah:': [ 128334 ],
  ':clock1:': [ 128336 ],
  ':clock2:': [ 128337 ],
  ':clock3:': [ 128338 ],
  ':clock4:': [ 128339 ],
  ':clock5:': [ 128340 ],
  ':clock6:': [ 128341 ],
  ':clock7:': [ 128342 ],
  ':clock8:': [ 128343 ],
  ':clock9:': [ 128344 ],
  ':clock10:': [ 128345 ],
  ':clock11:': [ 128346 ],
  ':clock12:': [ 128347 ],
  ':clock130:': [ 128348 ],
  ':clock230:': [ 128349 ],
  ':clock330:': [ 128350 ],
  ':clock430:': [ 128351 ],
  ':clock530:': [ 128352 ],
  ':clock630:': [ 128353 ],
  ':clock730:': [ 128354 ],
  ':clock830:': [ 128355 ],
  ':clock930:': [ 128356 ],
  ':clock1030:': [ 128357 ],
  ':clock1130:': [ 128358 ],
  ':clock1230:': [ 128359 ],
  ':candle:': [ 128367 ],
  ':mantlepiece_clock:': [ 128368 ],
  ':clock:': [ 128368 ],
  ':hole:': [ 128371 ],
  ':man_in_business_suit_levitating:': [ 128372 ],
  ':levitate:': [ 128372 ],
  ':sleuth_or_spy:': [ 128373 ],
  ':spy:': [ 128373 ],
  ':sleuth_or_spy_tone1:': [ 128373, 127995 ],
  ':spy_tone1:': [ 128373, 127995 ],
  ':sleuth_or_spy_tone2:': [ 128373, 127996 ],
  ':spy_tone2:': [ 128373, 127996 ],
  ':sleuth_or_spy_tone3:': [ 128373, 127997 ],
  ':spy_tone3:': [ 128373, 127997 ],
  ':sleuth_or_spy_tone4:': [ 128373, 127998 ],
  ':spy_tone4:': [ 128373, 127998 ],
  ':sleuth_or_spy_tone5:': [ 128373, 127999 ],
  ':spy_tone5:': [ 128373, 127999 ],
  ':dark_sunglasses:': [ 128374 ],
  ':spider:': [ 128375 ],
  ':spider_web:': [ 128376 ],
  ':joystick:': [ 128377 ],
  ':male_dancer:': [ 128378 ],
  ':man_dancing:': [ 128378 ],
  ':male_dancer_tone1:': [ 128378, 127995 ],
  ':man_dancing_tone1:': [ 128378, 127995 ],
  ':male_dancer_tone2:': [ 128378, 127996 ],
  ':man_dancing_tone2:': [ 128378, 127996 ],
  ':male_dancer_tone3:': [ 128378, 127997 ],
  ':man_dancing_tone3:': [ 128378, 127997 ],
  ':male_dancer_tone4:': [ 128378, 127998 ],
  ':man_dancing_tone4:': [ 128378, 127998 ],
  ':male_dancer_tone5:': [ 128378, 127999 ],
  ':man_dancing_tone5:': [ 128378, 127999 ],
  ':linked_paperclips:': [ 128391 ],
  ':paperclips:': [ 128391 ],
  ':lower_left_ballpoint_pen:': [ 128394 ],
  ':pen_ballpoint:': [ 128394 ],
  ':lower_left_fountain_pen:': [ 128395 ],
  ':pen_fountain:': [ 128395 ],
  ':lower_left_paintbrush:': [ 128396 ],
  ':paintbrush:': [ 128396 ],
  ':lower_left_crayon:': [ 128397 ],
  ':crayon:': [ 128397 ],
  ':raised_hand_with_fingers_splayed:': [ 128400 ],
  ':hand_splayed:': [ 128400 ],
  ':raised_hand_with_fingers_splayed_tone1:': [ 128400, 127995 ],
  ':hand_splayed_tone1:': [ 128400, 127995 ],
  ':raised_hand_with_fingers_splayed_tone2:': [ 128400, 127996 ],
  ':hand_splayed_tone2:': [ 128400, 127996 ],
  ':raised_hand_with_fingers_splayed_tone3:': [ 128400, 127997 ],
  ':hand_splayed_tone3:': [ 128400, 127997 ],
  ':raised_hand_with_fingers_splayed_tone4:': [ 128400, 127998 ],
  ':hand_splayed_tone4:': [ 128400, 127998 ],
  ':raised_hand_with_fingers_splayed_tone5:': [ 128400, 127999 ],
  ':hand_splayed_tone5:': [ 128400, 127999 ],
  ':reversed_hand_with_middle_finger_extended:': [ 128405 ],
  ':middle_finger:': [ 128405 ],
  ':reversed_hand_with_middle_finger_extended_tone1:': [ 128405, 127995 ],
  ':middle_finger_tone1:': [ 128405, 127995 ],
  ':reversed_hand_with_middle_finger_extended_tone2:': [ 128405, 127996 ],
  ':middle_finger_tone2:': [ 128405, 127996 ],
  ':reversed_hand_with_middle_finger_extended_tone3:': [ 128405, 127997 ],
  ':middle_finger_tone3:': [ 128405, 127997 ],
  ':reversed_hand_with_middle_finger_extended_tone4:': [ 128405, 127998 ],
  ':middle_finger_tone4:': [ 128405, 127998 ],
  ':reversed_hand_with_middle_finger_extended_tone5:': [ 128405, 127999 ],
  ':middle_finger_tone5:': [ 128405, 127999 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers:': [ 128406 ],
  ':vulcan:': [ 128406 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers_tone1:': [ 128406, 127995 ],
  ':vulcan_tone1:': [ 128406, 127995 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers_tone2:': [ 128406, 127996 ],
  ':vulcan_tone2:': [ 128406, 127996 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers_tone3:': [ 128406, 127997 ],
  ':vulcan_tone3:': [ 128406, 127997 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers_tone4:': [ 128406, 127998 ],
  ':vulcan_tone4:': [ 128406, 127998 ],
  ':raised_hand_with_part_between_middle_and_ring_fingers_tone5:': [ 128406, 127999 ],
  ':vulcan_tone5:': [ 128406, 127999 ],
  ':black_heart:': [ 128420 ],
  ':desktop_computer:': [ 128421 ],
  ':desktop:': [ 128421 ],
  ':printer:': [ 128424 ],
  ':three_button_mouse:': [ 128433 ],
  ':mouse_three_button:': [ 128433 ],
  ':trackball:': [ 128434 ],
  ':frame_with_picture:': [ 128444 ],
  ':frame_photo:': [ 128444 ],
  ':card_index_dividers:': [ 128450 ],
  ':dividers:': [ 128450 ],
  ':card_file_box:': [ 128451 ],
  ':card_box:': [ 128451 ],
  ':file_cabinet:': [ 128452 ],
  ':wastebasket:': [ 128465 ],
  ':spiral_note_pad:': [ 128466 ],
  ':notepad_spiral:': [ 128466 ],
  ':spiral_calendar_pad:': [ 128467 ],
  ':calendar_spiral:': [ 128467 ],
  ':compression:': [ 128476 ],
  ':old_key:': [ 128477 ],
  ':key2:': [ 128477 ],
  ':rolled_up_newspaper:': [ 128478 ],
  ':newspaper2:': [ 128478 ],
  ':dagger_knife:': [ 128481 ],
  ':dagger:': [ 128481 ],
  ':speaking_head_in_silhouette:': [ 128483 ],
  ':speaking_head:': [ 128483 ],
  ':left_speech_bubble:': [ 128488 ],
  ':speech_left:': [ 128488 ],
  ':right_anger_bubble:': [ 128495 ],
  ':anger_right:': [ 128495 ],
  ':ballot_box_with_ballot:': [ 128499 ],
  ':ballot_box:': [ 128499 ],
  ':world_map:': [ 128506 ],
  ':map:': [ 128506 ],
  ':mount_fuji:': [ 128507 ],
  ':tokyo_tower:': [ 128508 ],
  ':statue_of_liberty:': [ 128509 ],
  ':japan:': [ 128510 ],
  ':moyai:': [ 128511 ],
  ':grinning:': [ 128512 ],
  ':grin:': [ 128513 ],
  ':joy:': [ 128514 ],
  ':smiley:': [ 128515 ],
  ':smile:': [ 128516 ],
  ':sweat_smile:': [ 128517 ],
  ':satisfied:': [ 128518 ],
  ':laughing:': [ 128518 ],
  ':innocent:': [ 128519 ],
  ':smiling_imp:': [ 128520 ],
  ':wink:': [ 128521 ],
  ':blush:': [ 128522 ],
  ':yum:': [ 128523 ],
  ':relieved:': [ 128524 ],
  ':heart_eyes:': [ 128525 ],
  ':sunglasses:': [ 128526 ],
  ':smirk:': [ 128527 ],
  ':neutral_face:': [ 128528 ],
  ':expressionless:': [ 128529 ],
  ':unamused:': [ 128530 ],
  ':sweat:': [ 128531 ],
  ':pensive:': [ 128532 ],
  ':confused:': [ 128533 ],
  ':confounded:': [ 128534 ],
  ':kissing:': [ 128535 ],
  ':kissing_heart:': [ 128536 ],
  ':kissing_smiling_eyes:': [ 128537 ],
  ':kissing_closed_eyes:': [ 128538 ],
  ':stuck_out_tongue:': [ 128539 ],
  ':stuck_out_tongue_winking_eye:': [ 128540 ],
  ':stuck_out_tongue_closed_eyes:': [ 128541 ],
  ':disappointed:': [ 128542 ],
  ':worried:': [ 128543 ],
  ':angry:': [ 128544 ],
  ':rage:': [ 128545 ],
  ':cry:': [ 128546 ],
  ':persevere:': [ 128547 ],
  ':triumph:': [ 128548 ],
  ':disappointed_relieved:': [ 128549 ],
  ':frowning:': [ 128550 ],
  ':anguished:': [ 128551 ],
  ':fearful:': [ 128552 ],
  ':weary:': [ 128553 ],
  ':sleepy:': [ 128554 ],
  ':tired_face:': [ 128555 ],
  ':grimacing:': [ 128556 ],
  ':sob:': [ 128557 ],
  ':open_mouth:': [ 128558 ],
  ':hushed:': [ 128559 ],
  ':cold_sweat:': [ 128560 ],
  ':scream:': [ 128561 ],
  ':astonished:': [ 128562 ],
  ':flushed:': [ 128563 ],
  ':sleeping:': [ 128564 ],
  ':dizzy_face:': [ 128565 ],
  ':no_mouth:': [ 128566 ],
  ':mask:': [ 128567 ],
  ':smile_cat:': [ 128568 ],
  ':joy_cat:': [ 128569 ],
  ':smiley_cat:': [ 128570 ],
  ':heart_eyes_cat:': [ 128571 ],
  ':smirk_cat:': [ 128572 ],
  ':kissing_cat:': [ 128573 ],
  ':pouting_cat:': [ 128574 ],
  ':crying_cat_face:': [ 128575 ],
  ':scream_cat:': [ 128576 ],
  ':slightly_frowning_face:': [ 128577 ],
  ':slight_frown:': [ 128577 ],
  ':slightly_smiling_face:': [ 128578 ],
  ':slight_smile:': [ 128578 ],
  ':upside_down_face:': [ 128579 ],
  ':upside_down:': [ 128579 ],
  ':face_with_rolling_eyes:': [ 128580 ],
  ':rolling_eyes:': [ 128580 ],
  ':no_good:': [ 128581 ],
  ':no_good_tone1:': [ 128581, 127995 ],
  ':no_good_tone2:': [ 128581, 127996 ],
  ':no_good_tone3:': [ 128581, 127997 ],
  ':no_good_tone4:': [ 128581, 127998 ],
  ':no_good_tone5:': [ 128581, 127999 ],
  ':ok_woman:': [ 128582 ],
  ':ok_woman_tone1:': [ 128582, 127995 ],
  ':ok_woman_tone2:': [ 128582, 127996 ],
  ':ok_woman_tone3:': [ 128582, 127997 ],
  ':ok_woman_tone4:': [ 128582, 127998 ],
  ':ok_woman_tone5:': [ 128582, 127999 ],
  ':bow:': [ 128583 ],
  ':bow_tone1:': [ 128583, 127995 ],
  ':bow_tone2:': [ 128583, 127996 ],
  ':bow_tone3:': [ 128583, 127997 ],
  ':bow_tone4:': [ 128583, 127998 ],
  ':bow_tone5:': [ 128583, 127999 ],
  ':see_no_evil:': [ 128584 ],
  ':hear_no_evil:': [ 128585 ],
  ':speak_no_evil:': [ 128586 ],
  ':raising_hand:': [ 128587 ],
  ':raising_hand_tone1:': [ 128587, 127995 ],
  ':raising_hand_tone2:': [ 128587, 127996 ],
  ':raising_hand_tone3:': [ 128587, 127997 ],
  ':raising_hand_tone4:': [ 128587, 127998 ],
  ':raising_hand_tone5:': [ 128587, 127999 ],
  ':raised_hands:': [ 128588 ],
  ':raised_hands_tone1:': [ 128588, 127995 ],
  ':raised_hands_tone2:': [ 128588, 127996 ],
  ':raised_hands_tone3:': [ 128588, 127997 ],
  ':raised_hands_tone4:': [ 128588, 127998 ],
  ':raised_hands_tone5:': [ 128588, 127999 ],
  ':person_frowning:': [ 128589 ],
  ':person_frowning_tone1:': [ 128589, 127995 ],
  ':person_frowning_tone2:': [ 128589, 127996 ],
  ':person_frowning_tone3:': [ 128589, 127997 ],
  ':person_frowning_tone4:': [ 128589, 127998 ],
  ':person_frowning_tone5:': [ 128589, 127999 ],
  ':person_with_pouting_face:': [ 128590 ],
  ':person_with_pouting_face_tone1:': [ 128590, 127995 ],
  ':person_with_pouting_face_tone2:': [ 128590, 127996 ],
  ':person_with_pouting_face_tone3:': [ 128590, 127997 ],
  ':person_with_pouting_face_tone4:': [ 128590, 127998 ],
  ':person_with_pouting_face_tone5:': [ 128590, 127999 ],
  ':pray:': [ 128591 ],
  ':pray_tone1:': [ 128591, 127995 ],
  ':pray_tone2:': [ 128591, 127996 ],
  ':pray_tone3:': [ 128591, 127997 ],
  ':pray_tone4:': [ 128591, 127998 ],
  ':pray_tone5:': [ 128591, 127999 ],
  ':rocket:': [ 128640 ],
  ':helicopter:': [ 128641 ],
  ':steam_locomotive:': [ 128642 ],
  ':railway_car:': [ 128643 ],
  ':bullettrain_side:': [ 128644 ],
  ':bullettrain_front:': [ 128645 ],
  ':train2:': [ 128646 ],
  ':metro:': [ 128647 ],
  ':light_rail:': [ 128648 ],
  ':station:': [ 128649 ],
  ':tram:': [ 128650 ],
  ':train:': [ 128651 ],
  ':bus:': [ 128652 ],
  ':oncoming_bus:': [ 128653 ],
  ':trolleybus:': [ 128654 ],
  ':busstop:': [ 128655 ],
  ':minibus:': [ 128656 ],
  ':ambulance:': [ 128657 ],
  ':fire_engine:': [ 128658 ],
  ':police_car:': [ 128659 ],
  ':oncoming_police_car:': [ 128660 ],
  ':taxi:': [ 128661 ],
  ':oncoming_taxi:': [ 128662 ],
  ':red_car:': [ 128663 ],
  ':oncoming_automobile:': [ 128664 ],
  ':blue_car:': [ 128665 ],
  ':truck:': [ 128666 ],
  ':articulated_lorry:': [ 128667 ],
  ':tractor:': [ 128668 ],
  ':monorail:': [ 128669 ],
  ':mountain_railway:': [ 128670 ],
  ':suspension_railway:': [ 128671 ],
  ':mountain_cableway:': [ 128672 ],
  ':aerial_tramway:': [ 128673 ],
  ':ship:': [ 128674 ],
  ':rowboat:': [ 128675 ],
  ':rowboat_tone1:': [ 128675, 127995 ],
  ':rowboat_tone2:': [ 128675, 127996 ],
  ':rowboat_tone3:': [ 128675, 127997 ],
  ':rowboat_tone4:': [ 128675, 127998 ],
  ':rowboat_tone5:': [ 128675, 127999 ],
  ':speedboat:': [ 128676 ],
  ':traffic_light:': [ 128677 ],
  ':vertical_traffic_light:': [ 128678 ],
  ':construction:': [ 128679 ],
  ':rotating_light:': [ 128680 ],
  ':triangular_flag_on_post:': [ 128681 ],
  ':door:': [ 128682 ],
  ':no_entry_sign:': [ 128683 ],
  ':smoking:': [ 128684 ],
  ':no_smoking:': [ 128685 ],
  ':put_litter_in_its_place:': [ 128686 ],
  ':do_not_litter:': [ 128687 ],
  ':potable_water:': [ 128688 ],
  ':non-potable_water:': [ 128689 ],
  ':bike:': [ 128690 ],
  ':no_bicycles:': [ 128691 ],
  ':bicyclist:': [ 128692 ],
  ':bicyclist_tone1:': [ 128692, 127995 ],
  ':bicyclist_tone2:': [ 128692, 127996 ],
  ':bicyclist_tone3:': [ 128692, 127997 ],
  ':bicyclist_tone4:': [ 128692, 127998 ],
  ':bicyclist_tone5:': [ 128692, 127999 ],
  ':mountain_bicyclist:': [ 128693 ],
  ':mountain_bicyclist_tone1:': [ 128693, 127995 ],
  ':mountain_bicyclist_tone2:': [ 128693, 127996 ],
  ':mountain_bicyclist_tone3:': [ 128693, 127997 ],
  ':mountain_bicyclist_tone4:': [ 128693, 127998 ],
  ':mountain_bicyclist_tone5:': [ 128693, 127999 ],
  ':walking:': [ 128694 ],
  ':walking_tone1:': [ 128694, 127995 ],
  ':walking_tone2:': [ 128694, 127996 ],
  ':walking_tone3:': [ 128694, 127997 ],
  ':walking_tone4:': [ 128694, 127998 ],
  ':walking_tone5:': [ 128694, 127999 ],
  ':no_pedestrians:': [ 128695 ],
  ':children_crossing:': [ 128696 ],
  ':mens:': [ 128697 ],
  ':womens:': [ 128698 ],
  ':restroom:': [ 128699 ],
  ':baby_symbol:': [ 128700 ],
  ':toilet:': [ 128701 ],
  ':wc:': [ 128702 ],
  ':shower:': [ 128703 ],
  ':bath:': [ 128704 ],
  ':bath_tone1:': [ 128704, 127995 ],
  ':bath_tone2:': [ 128704, 127996 ],
  ':bath_tone3:': [ 128704, 127997 ],
  ':bath_tone4:': [ 128704, 127998 ],
  ':bath_tone5:': [ 128704, 127999 ],
  ':bathtub:': [ 128705 ],
  ':passport_control:': [ 128706 ],
  ':customs:': [ 128707 ],
  ':baggage_claim:': [ 128708 ],
  ':left_luggage:': [ 128709 ],
  ':couch_and_lamp:': [ 128715 ],
  ':couch:': [ 128715 ],
  ':sleeping_accommodation:': [ 128716 ],
  ':shopping_bags:': [ 128717 ],
  ':bellhop_bell:': [ 128718 ],
  ':bellhop:': [ 128718 ],
  ':bed:': [ 128719 ],
  ':worship_symbol:': [ 128720 ],
  ':place_of_worship:': [ 128720 ],
  ':stop_sign:': [ 128721 ],
  ':octagonal_sign:': [ 128721 ],
  ':shopping_trolley:': [ 128722 ],
  ':shopping_cart:': [ 128722 ],
  ':hammer_and_wrench:': [ 128736 ],
  ':tools:': [ 128736 ],
  ':shield:': [ 128737 ],
  ':oil_drum:': [ 128738 ],
  ':oil:': [ 128738 ],
  ':motorway:': [ 128739 ],
  ':railroad_track:': [ 128740 ],
  ':railway_track:': [ 128740 ],
  ':motorboat:': [ 128741 ],
  ':small_airplane:': [ 128745 ],
  ':airplane_small:': [ 128745 ],
  ':airplane_departure:': [ 128747 ],
  ':airplane_arriving:': [ 128748 ],
  ':satellite_orbital:': [ 128752 ],
  ':passenger_ship:': [ 128755 ],
  ':cruise_ship:': [ 128755 ],
  ':scooter:': [ 128756 ],
  ':motorbike:': [ 128757 ],
  ':motor_scooter:': [ 128757 ],
  ':kayak:': [ 128758 ],
  ':canoe:': [ 128758 ],
  ':zipper_mouth_face:': [ 129296 ],
  ':zipper_mouth:': [ 129296 ],
  ':money_mouth_face:': [ 129297 ],
  ':money_mouth:': [ 129297 ],
  ':face_with_thermometer:': [ 129298 ],
  ':thermometer_face:': [ 129298 ],
  ':nerd_face:': [ 129299 ],
  ':nerd:': [ 129299 ],
  ':thinking_face:': [ 129300 ],
  ':thinking:': [ 129300 ],
  ':face_with_head_bandage:': [ 129301 ],
  ':head_bandage:': [ 129301 ],
  ':robot_face:': [ 129302 ],
  ':robot:': [ 129302 ],
  ':hugging_face:': [ 129303 ],
  ':hugging:': [ 129303 ],
  ':sign_of_the_horns:': [ 129304 ],
  ':metal:': [ 129304 ],
  ':sign_of_the_horns_tone1:': [ 129304, 127995 ],
  ':metal_tone1:': [ 129304, 127995 ],
  ':sign_of_the_horns_tone2:': [ 129304, 127996 ],
  ':metal_tone2:': [ 129304, 127996 ],
  ':sign_of_the_horns_tone3:': [ 129304, 127997 ],
  ':metal_tone3:': [ 129304, 127997 ],
  ':sign_of_the_horns_tone4:': [ 129304, 127998 ],
  ':metal_tone4:': [ 129304, 127998 ],
  ':sign_of_the_horns_tone5:': [ 129304, 127999 ],
  ':metal_tone5:': [ 129304, 127999 ],
  ':call_me_hand:': [ 129305 ],
  ':call_me:': [ 129305 ],
  ':call_me_hand_tone1:': [ 129305, 127995 ],
  ':call_me_tone1:': [ 129305, 127995 ],
  ':call_me_hand_tone2:': [ 129305, 127996 ],
  ':call_me_tone2:': [ 129305, 127996 ],
  ':call_me_hand_tone3:': [ 129305, 127997 ],
  ':call_me_tone3:': [ 129305, 127997 ],
  ':call_me_hand_tone4:': [ 129305, 127998 ],
  ':call_me_tone4:': [ 129305, 127998 ],
  ':call_me_hand_tone5:': [ 129305, 127999 ],
  ':call_me_tone5:': [ 129305, 127999 ],
  ':back_of_hand:': [ 129306 ],
  ':raised_back_of_hand:': [ 129306 ],
  ':back_of_hand_tone1:': [ 129306, 127995 ],
  ':raised_back_of_hand_tone1:': [ 129306, 127995 ],
  ':back_of_hand_tone2:': [ 129306, 127996 ],
  ':raised_back_of_hand_tone2:': [ 129306, 127996 ],
  ':back_of_hand_tone3:': [ 129306, 127997 ],
  ':raised_back_of_hand_tone3:': [ 129306, 127997 ],
  ':back_of_hand_tone4:': [ 129306, 127998 ],
  ':raised_back_of_hand_tone4:': [ 129306, 127998 ],
  ':back_of_hand_tone5:': [ 129306, 127999 ],
  ':raised_back_of_hand_tone5:': [ 129306, 127999 ],
  ':left_fist:': [ 129307 ],
  ':left_facing_fist:': [ 129307 ],
  ':left_fist_tone1:': [ 129307, 127995 ],
  ':left_facing_fist_tone1:': [ 129307, 127995 ],
  ':left_fist_tone2:': [ 129307, 127996 ],
  ':left_facing_fist_tone2:': [ 129307, 127996 ],
  ':left_fist_tone3:': [ 129307, 127997 ],
  ':left_facing_fist_tone3:': [ 129307, 127997 ],
  ':left_fist_tone4:': [ 129307, 127998 ],
  ':left_facing_fist_tone4:': [ 129307, 127998 ],
  ':left_fist_tone5:': [ 129307, 127999 ],
  ':left_facing_fist_tone5:': [ 129307, 127999 ],
  ':right_fist:': [ 129308 ],
  ':right_facing_fist:': [ 129308 ],
  ':right_fist_tone1:': [ 129308, 127995 ],
  ':right_facing_fist_tone1:': [ 129308, 127995 ],
  ':right_fist_tone2:': [ 129308, 127996 ],
  ':right_facing_fist_tone2:': [ 129308, 127996 ],
  ':right_fist_tone3:': [ 129308, 127997 ],
  ':right_facing_fist_tone3:': [ 129308, 127997 ],
  ':right_fist_tone4:': [ 129308, 127998 ],
  ':right_facing_fist_tone4:': [ 129308, 127998 ],
  ':right_fist_tone5:': [ 129308, 127999 ],
  ':right_facing_fist_tone5:': [ 129308, 127999 ],
  ':shaking_hands:': [ 129309 ],
  ':handshake:': [ 129309 ],
  ':shaking_hands_tone1:': [ 129309, 127995 ],
  ':handshake_tone1:': [ 129309, 127995 ],
  ':shaking_hands_tone2:': [ 129309, 127996 ],
  ':handshake_tone2:': [ 129309, 127996 ],
  ':shaking_hands_tone3:': [ 129309, 127997 ],
  ':handshake_tone3:': [ 129309, 127997 ],
  ':shaking_hands_tone4:': [ 129309, 127998 ],
  ':handshake_tone4:': [ 129309, 127998 ],
  ':shaking_hands_tone5:': [ 129309, 127999 ],
  ':handshake_tone5:': [ 129309, 127999 ],
  ':hand_with_index_and_middle_finger_crossed:': [ 129310 ],
  ':fingers_crossed:': [ 129310 ],
  ':hand_with_index_and_middle_fingers_crossed_tone1:': [ 129310, 127995 ],
  ':fingers_crossed_tone1:': [ 129310, 127995 ],
  ':hand_with_index_and_middle_fingers_crossed_tone2:': [ 129310, 127996 ],
  ':fingers_crossed_tone2:': [ 129310, 127996 ],
  ':hand_with_index_and_middle_fingers_crossed_tone3:': [ 129310, 127997 ],
  ':fingers_crossed_tone3:': [ 129310, 127997 ],
  ':hand_with_index_and_middle_fingers_crossed_tone4:': [ 129310, 127998 ],
  ':fingers_crossed_tone4:': [ 129310, 127998 ],
  ':hand_with_index_and_middle_fingers_crossed_tone5:': [ 129310, 127999 ],
  ':fingers_crossed_tone5:': [ 129310, 127999 ],
  ':face_with_cowboy_hat:': [ 129312 ],
  ':cowboy:': [ 129312 ],
  ':clown_face:': [ 129313 ],
  ':clown:': [ 129313 ],
  ':sick:': [ 129314 ],
  ':nauseated_face:': [ 129314 ],
  ':rolling_on_the_floor_laughing:': [ 129315 ],
  ':rofl:': [ 129315 ],
  ':drool:': [ 129316 ],
  ':drooling_face:': [ 129316 ],
  ':liar:': [ 129317 ],
  ':lying_face:': [ 129317 ],
  ':facepalm:': [ 129318 ],
  ':face_palm:': [ 129318 ],
  ':facepalm_tone1:': [ 129318, 127995 ],
  ':face_palm_tone1:': [ 129318, 127995 ],
  ':facepalm_tone2:': [ 129318, 127996 ],
  ':face_palm_tone2:': [ 129318, 127996 ],
  ':facepalm_tone3:': [ 129318, 127997 ],
  ':face_palm_tone3:': [ 129318, 127997 ],
  ':facepalm_tone4:': [ 129318, 127998 ],
  ':face_palm_tone4:': [ 129318, 127998 ],
  ':facepalm_tone5:': [ 129318, 127999 ],
  ':face_palm_tone5:': [ 129318, 127999 ],
  ':sneeze:': [ 129319 ],
  ':sneezing_face:': [ 129319 ],
  ':expecting_woman:': [ 129328 ],
  ':pregnant_woman:': [ 129328 ],
  ':expecting_woman_tone1:': [ 129328, 127995 ],
  ':pregnant_woman_tone1:': [ 129328, 127995 ],
  ':expecting_woman_tone2:': [ 129328, 127996 ],
  ':pregnant_woman_tone2:': [ 129328, 127996 ],
  ':expecting_woman_tone3:': [ 129328, 127997 ],
  ':pregnant_woman_tone3:': [ 129328, 127997 ],
  ':expecting_woman_tone4:': [ 129328, 127998 ],
  ':pregnant_woman_tone4:': [ 129328, 127998 ],
  ':expecting_woman_tone5:': [ 129328, 127999 ],
  ':pregnant_woman_tone5:': [ 129328, 127999 ],
  ':selfie:': [ 129331 ],
  ':selfie_tone1:': [ 129331, 127995 ],
  ':selfie_tone2:': [ 129331, 127996 ],
  ':selfie_tone3:': [ 129331, 127997 ],
  ':selfie_tone4:': [ 129331, 127998 ],
  ':selfie_tone5:': [ 129331, 127999 ],
  ':prince:': [ 129332 ],
  ':prince_tone1:': [ 129332, 127995 ],
  ':prince_tone2:': [ 129332, 127996 ],
  ':prince_tone3:': [ 129332, 127997 ],
  ':prince_tone4:': [ 129332, 127998 ],
  ':prince_tone5:': [ 129332, 127999 ],
  ':man_in_tuxedo:': [ 129333 ],
  ':tuxedo_tone1:': [ 129333, 127995 ],
  ':man_in_tuxedo_tone1:': [ 129333, 127995 ],
  ':tuxedo_tone2:': [ 129333, 127996 ],
  ':man_in_tuxedo_tone2:': [ 129333, 127996 ],
  ':tuxedo_tone3:': [ 129333, 127997 ],
  ':man_in_tuxedo_tone3:': [ 129333, 127997 ],
  ':tuxedo_tone4:': [ 129333, 127998 ],
  ':man_in_tuxedo_tone4:': [ 129333, 127998 ],
  ':tuxedo_tone5:': [ 129333, 127999 ],
  ':man_in_tuxedo_tone5:': [ 129333, 127999 ],
  ':mother_christmas:': [ 129334 ],
  ':mrs_claus:': [ 129334 ],
  ':mother_christmas_tone1:': [ 129334, 127995 ],
  ':mrs_claus_tone1:': [ 129334, 127995 ],
  ':mother_christmas_tone2:': [ 129334, 127996 ],
  ':mrs_claus_tone2:': [ 129334, 127996 ],
  ':mother_christmas_tone3:': [ 129334, 127997 ],
  ':mrs_claus_tone3:': [ 129334, 127997 ],
  ':mother_christmas_tone4:': [ 129334, 127998 ],
  ':mrs_claus_tone4:': [ 129334, 127998 ],
  ':mother_christmas_tone5:': [ 129334, 127999 ],
  ':mrs_claus_tone5:': [ 129334, 127999 ],
  ':shrug:': [ 129335 ],
  ':shrug_tone1:': [ 129335, 127995 ],
  ':shrug_tone2:': [ 129335, 127996 ],
  ':shrug_tone3:': [ 129335, 127997 ],
  ':shrug_tone4:': [ 129335, 127998 ],
  ':shrug_tone5:': [ 129335, 127999 ],
  ':person_doing_cartwheel:': [ 129336 ],
  ':cartwheel:': [ 129336 ],
  ':person_doing_cartwheel_tone1:': [ 129336, 127995 ],
  ':cartwheel_tone1:': [ 129336, 127995 ],
  ':person_doing_cartwheel_tone2:': [ 129336, 127996 ],
  ':cartwheel_tone2:': [ 129336, 127996 ],
  ':person_doing_cartwheel_tone3:': [ 129336, 127997 ],
  ':cartwheel_tone3:': [ 129336, 127997 ],
  ':person_doing_cartwheel_tone4:': [ 129336, 127998 ],
  ':cartwheel_tone4:': [ 129336, 127998 ],
  ':person_doing_cartwheel_tone5:': [ 129336, 127999 ],
  ':cartwheel_tone5:': [ 129336, 127999 ],
  ':juggler:': [ 129337 ],
  ':juggling:': [ 129337 ],
  ':juggler_tone1:': [ 129337, 127995 ],
  ':juggling_tone1:': [ 129337, 127995 ],
  ':juggler_tone2:': [ 129337, 127996 ],
  ':juggling_tone2:': [ 129337, 127996 ],
  ':juggler_tone3:': [ 129337, 127997 ],
  ':juggling_tone3:': [ 129337, 127997 ],
  ':juggler_tone4:': [ 129337, 127998 ],
  ':juggling_tone4:': [ 129337, 127998 ],
  ':juggler_tone5:': [ 129337, 127999 ],
  ':juggling_tone5:': [ 129337, 127999 ],
  ':fencing:': [ 129338 ],
  ':fencer:': [ 129338 ],
  ':wrestling:': [ 129340 ],
  ':wrestlers:': [ 129340 ],
  ':wrestling_tone1:': [ 129340, 127995 ],
  ':wrestlers_tone1:': [ 129340, 127995 ],
  ':wrestling_tone2:': [ 129340, 127996 ],
  ':wrestlers_tone2:': [ 129340, 127996 ],
  ':wrestling_tone3:': [ 129340, 127997 ],
  ':wrestlers_tone3:': [ 129340, 127997 ],
  ':wrestling_tone4:': [ 129340, 127998 ],
  ':wrestlers_tone4:': [ 129340, 127998 ],
  ':wrestling_tone5:': [ 129340, 127999 ],
  ':wrestlers_tone5:': [ 129340, 127999 ],
  ':water_polo:': [ 129341 ],
  ':water_polo_tone1:': [ 129341, 127995 ],
  ':water_polo_tone2:': [ 129341, 127996 ],
  ':water_polo_tone3:': [ 129341, 127997 ],
  ':water_polo_tone4:': [ 129341, 127998 ],
  ':water_polo_tone5:': [ 129341, 127999 ],
  ':handball:': [ 129342 ],
  ':handball_tone1:': [ 129342, 127995 ],
  ':handball_tone2:': [ 129342, 127996 ],
  ':handball_tone3:': [ 129342, 127997 ],
  ':handball_tone4:': [ 129342, 127998 ],
  ':handball_tone5:': [ 129342, 127999 ],
  ':wilted_flower:': [ 129344 ],
  ':wilted_rose:': [ 129344 ],
  ':drum_with_drumsticks:': [ 129345 ],
  ':drum:': [ 129345 ],
  ':clinking_glass:': [ 129346 ],
  ':champagne_glass:': [ 129346 ],
  ':whisky:': [ 129347 ],
  ':tumbler_glass:': [ 129347 ],
  ':spoon:': [ 129348 ],
  ':goal_net:': [ 129349 ],
  ':goal:': [ 129349 ],
  ':first_place_medal:': [ 129351 ],
  ':first_place:': [ 129351 ],
  ':second_place_medal:': [ 129352 ],
  ':second_place:': [ 129352 ],
  ':third_place_medal:': [ 129353 ],
  ':third_place:': [ 129353 ],
  ':boxing_gloves:': [ 129354 ],
  ':boxing_glove:': [ 129354 ],
  ':karate_uniform:': [ 129355 ],
  ':martial_arts_uniform:': [ 129355 ],
  ':croissant:': [ 129360 ],
  ':avocado:': [ 129361 ],
  ':cucumber:': [ 129362 ],
  ':bacon:': [ 129363 ],
  ':potato:': [ 129364 ],
  ':carrot:': [ 129365 ],
  ':baguette_bread:': [ 129366 ],
  ':french_bread:': [ 129366 ],
  ':green_salad:': [ 129367 ],
  ':salad:': [ 129367 ],
  ':paella:': [ 129368 ],
  ':shallow_pan_of_food:': [ 129368 ],
  ':stuffed_pita:': [ 129369 ],
  ':stuffed_flatbread:': [ 129369 ],
  ':egg:': [ 129370 ],
  ':glass_of_milk:': [ 129371 ],
  ':milk:': [ 129371 ],
  ':shelled_peanut:': [ 129372 ],
  ':peanuts:': [ 129372 ],
  ':kiwifruit:': [ 129373 ],
  ':kiwi:': [ 129373 ],
  ':pancakes:': [ 129374 ],
  ':crab:': [ 129408 ],
  ':lion:': [ 129409 ],
  ':lion_face:': [ 129409 ],
  ':scorpion:': [ 129410 ],
  ':turkey:': [ 129411 ],
  ':unicorn_face:': [ 129412 ],
  ':unicorn:': [ 129412 ],
  ':eagle:': [ 129413 ],
  ':duck:': [ 129414 ],
  ':bat:': [ 129415 ],
  ':shark:': [ 129416 ],
  ':owl:': [ 129417 ],
  ':fox_face:': [ 129418 ],
  ':fox:': [ 129418 ],
  ':butterfly:': [ 129419 ],
  ':deer:': [ 129420 ],
  ':gorilla:': [ 129421 ],
  ':lizard:': [ 129422 ],
  ':rhinoceros:': [ 129423 ],
  ':rhino:': [ 129423 ],
  ':shrimp:': [ 129424 ],
  ':squid:': [ 129425 ],
  ':cheese_wedge:': [ 129472 ],
  ':cheese:': [ 129472 ],
  ':bangbang:': [ 8252 ],
  ':leftwards_arrow_with_hook:': [ 8617 ],
  ':arrow_right_hook:': [ 8618 ],
  ':watch:': [ 8986 ],
  ':hourglass:': [ 8987 ],
  ':eject_symbol:': [ 9167 ],
  ':eject:': [ 9167 ],
  ':fast_forward:': [ 9193 ],
  ':rewind:': [ 9194 ],
  ':arrow_double_up:': [ 9195 ],
  ':arrow_double_down:': [ 9196 ],
  ':next_track:': [ 9197 ],
  ':track_next:': [ 9197 ],
  ':previous_track:': [ 9198 ],
  ':track_previous:': [ 9198 ],
  ':play_pause:': [ 9199 ],
  ':alarm_clock:': [ 9200 ],
  ':stopwatch:': [ 9201 ],
  ':timer_clock:': [ 9202 ],
  ':timer:': [ 9202 ],
  ':hourglass_flowing_sand:': [ 9203 ],
  ':double_vertical_bar:': [ 9208 ],
  ':pause_button:': [ 9208 ],
  ':stop_button:': [ 9209 ],
  ':record_button:': [ 9210 ],
  ':m:': [ 9410 ],
  ':black_small_square:': [ 9642 ],
  ':white_small_square:': [ 9643 ],
  ':arrow_forward:': [ 9654 ],
  ':arrow_backward:': [ 9664 ],
  ':white_medium_square:': [ 9723 ],
  ':black_medium_square:': [ 9724 ],
  ':white_medium_small_square:': [ 9725 ],
  ':black_medium_small_square:': [ 9726 ],
  ':telephone:': [ 9742 ],
  ':point_up:': [ 9757 ],
  ':point_up_tone1:': [ 9757, 127995 ],
  ':point_up_tone2:': [ 9757, 127996 ],
  ':point_up_tone3:': [ 9757, 127997 ],
  ':point_up_tone4:': [ 9757, 127998 ],
  ':point_up_tone5:': [ 9757, 127999 ],
  ':star_and_crescent:': [ 9770 ],
  ':peace_symbol:': [ 9774 ],
  ':peace:': [ 9774 ],
  ':yin_yang:': [ 9775 ],
  ':relaxed:': [ 9786 ],
  ':gemini:': [ 9802 ],
  ':cancer:': [ 9803 ],
  ':leo:': [ 9804 ],
  ':virgo:': [ 9805 ],
  ':libra:': [ 9806 ],
  ':scorpius:': [ 9807 ],
  ':recycle:': [ 9851 ],
  ':wheelchair:': [ 9855 ],
  ':atom_symbol:': [ 9883 ],
  ':atom:': [ 9883 ],
  ':fleur-de-lis:': [ 9884 ],
  ':warning:': [ 9888 ],
  ':zap:': [ 9889 ],
  ':white_circle:': [ 9898 ],
  ':black_circle:': [ 9899 ],
  ':coffin:': [ 9904 ],
  ':funeral_urn:': [ 9905 ],
  ':urn:': [ 9905 ],
  ':soccer:': [ 9917 ],
  ':baseball:': [ 9918 ],
  ':snowman:': [ 9924 ],
  ':partly_sunny:': [ 9925 ],
  ':thunder_cloud_and_rain:': [ 9928 ],
  ':thunder_cloud_rain:': [ 9928 ],
  ':ophiuchus:': [ 9934 ],
  ':pick:': [ 9935 ],
  ':helmet_with_white_cross:': [ 9937 ],
  ':helmet_with_cross:': [ 9937 ],
  ':chains:': [ 9939 ],
  ':no_entry:': [ 9940 ],
  ':shinto_shrine:': [ 9961 ],
  ':church:': [ 9962 ],
  ':mountain:': [ 9968 ],
  ':umbrella_on_ground:': [ 9969 ],
  ':beach_umbrella:': [ 9969 ],
  ':fountain:': [ 9970 ],
  ':golf:': [ 9971 ],
  ':ferry:': [ 9972 ],
  ':sailboat:': [ 9973 ],
  ':skier:': [ 9975 ],
  ':ice_skate:': [ 9976 ],
  ':person_with_ball:': [ 9977 ],
  ':basketball_player:': [ 9977 ],
  ':person_with_ball_tone1:': [ 9977, 127995 ],
  ':basketball_player_tone1:': [ 9977, 127995 ],
  ':person_with_ball_tone2:': [ 9977, 127996 ],
  ':basketball_player_tone2:': [ 9977, 127996 ],
  ':person_with_ball_tone3:': [ 9977, 127997 ],
  ':basketball_player_tone3:': [ 9977, 127997 ],
  ':person_with_ball_tone4:': [ 9977, 127998 ],
  ':basketball_player_tone4:': [ 9977, 127998 ],
  ':person_with_ball_tone5:': [ 9977, 127999 ],
  ':basketball_player_tone5:': [ 9977, 127999 ],
  ':tent:': [ 9978 ],
  ':fuelpump:': [ 9981 ],
  ':fist:': [ 9994 ],
  ':fist_tone1:': [ 9994, 127995 ],
  ':fist_tone2:': [ 9994, 127996 ],
  ':fist_tone3:': [ 9994, 127997 ],
  ':fist_tone4:': [ 9994, 127998 ],
  ':fist_tone5:': [ 9994, 127999 ],
  ':raised_hand:': [ 9995 ],
  ':raised_hand_tone1:': [ 9995, 127995 ],
  ':raised_hand_tone2:': [ 9995, 127996 ],
  ':raised_hand_tone3:': [ 9995, 127997 ],
  ':raised_hand_tone4:': [ 9995, 127998 ],
  ':raised_hand_tone5:': [ 9995, 127999 ],
  ':v:': [ 9996 ],
  ':v_tone1:': [ 9996, 127995 ],
  ':v_tone2:': [ 9996, 127996 ],
  ':v_tone3:': [ 9996, 127997 ],
  ':v_tone4:': [ 9996, 127998 ],
  ':v_tone5:': [ 9996, 127999 ],
  ':writing_hand:': [ 9997 ],
  ':writing_hand_tone1:': [ 9997, 127995 ],
  ':writing_hand_tone2:': [ 9997, 127996 ],
  ':writing_hand_tone3:': [ 9997, 127997 ],
  ':writing_hand_tone4:': [ 9997, 127998 ],
  ':writing_hand_tone5:': [ 9997, 127999 ],
  ':pencil2:': [ 9999 ],
  ':latin_cross:': [ 10013 ],
  ':cross:': [ 10013 ],
  ':x:': [ 10060 ],
  ':negative_squared_cross_mark:': [ 10062 ],
  ':arrow_right:': [ 10145 ],
  ':curly_loop:': [ 10160 ],
  ':loop:': [ 10175 ],
  ':arrow_left:': [ 11013 ],
  ':arrow_up:': [ 11014 ],
  ':arrow_down:': [ 11015 ],
  ':black_large_square:': [ 11035 ],
  ':white_large_square:': [ 11036 ],
  ':star:': [ 11088 ],
  ':o:': [ 11093 ],
  ':part_alternation_mark:': [ 12349 ] };

var EMPTY = '　';

var getShortcode = function(emoji) {
  var shortcode = L.Emoji.SHORTCODES[emoji];
  if (shortcode) {
    return String.fromCodePoint.apply(null, shortcode);
  }
  return emoji;
};

L.Emoji = L.Layer.extend({
  options: {
    showGeoJSON: true,
    size: 18,
    emoji: '❓',
    emptyEmoji: EMPTY
  },

  initialize: function(geoJSON, options) {
    this._getEmoji = this._getEmojiMethod(options);
    var preparedOptions = this._matchShortcodes(options);
    L.Util.setOptions(this, preparedOptions);

    // simplify polygons for faster PiP
    // TODO fine tune for each each z change
    this._geoJSON = geoJSON;
    // this._geoJSON = turf.simplify(geoJSON, 0.05, false);
  },

  onRemove: function() {
    if (this._geoJSONLayer) {
      this._geoJSONLayer.remove();
    }
    this._layer.remove();
    this._map.off('moveend', this._setGrid, this);
  },

  onAdd: function(map) {
    this._map = map;

    if (this.options.showGeoJSON) {
      this._geoJSONLayer = L.geoJSON(this._geoJSON, {
        style: function () {
          return {color: 'rgba(50, 50, 50, 0.5)', weight: 1, fill: false};
        }
      });
      this._geoJSONLayer.addTo(this._map);
    }

    this._layer = new EmojiLayer({size: this.options.size});
    this._layer.addTo(this._map);

    // get polygons envelope
    this._polygons = [];
    this._geoJSON.features.forEach(function(feature) {
      if (feature.geometry) {
        var env = index$3(feature).geometry.coordinates[0];
        var envLng = env.map(function(ll) { return ll[0]; });
        var envLat = env.map(function(ll) { return ll[1]; });

        this._polygons.push({
          feature: feature,
          envelope: {
            wLng: Math.min.apply(Math, envLng),
            sLat: Math.min.apply(Math, envLat),
            eLng: Math.max.apply(Math, envLng),
            nLat: Math.max.apply(Math, envLat)
          }
        });
      }
    }.bind(this));

    this._setGrid();
    this._map.on('moveend', this._setGrid, this);
  },

  getGrid: function() {
    return this._layer.getGrid();
  },

  copyGrid: function() {
    this._layer.copyGrid();
  },

  _setGrid: function() {
    var polygonsInViewport = [];

    var size = this.options.size;

    var computedStyle = window.getComputedStyle(this._map._container);
    var viewportWidth = parseFloat(computedStyle.width);
    var viewportHeight = parseFloat(computedStyle.height);

    // add the extra emoji to match the exact grid size
    viewportWidth += size - (viewportWidth % size);
    viewportHeight += size - (viewportHeight % size);

    var viewportNW = this._map.containerPointToLatLng([0, 0]);
    var viewportSE = this._map.containerPointToLatLng([viewportWidth, viewportHeight]);
    for (var i = 0; i < this._polygons.length; i++) {
      var poly = this._polygons[i];
      if ( !(poly.envelope.eLng < viewportNW.lng ||
        poly.envelope.wLng > viewportSE.lng ||
        poly.envelope.sLat > viewportNW.lat ||
        poly.envelope.nLat < viewportSE.lat)) {
        polygonsInViewport.push(poly.feature);
      }
    }

    var values = [];

    for (var y = 0; y < viewportHeight; y += size) {
      var line = [];
      for (var x = 0; x < viewportWidth; x += size) {
        var ll = this._map.containerPointToLatLng([x + size/2, y + size/2]);
        var emoji = null;
        for (i = 0; i < polygonsInViewport.length; i++) {
          var feature = polygonsInViewport[i];
          var inside = index([ll.lng, ll.lat], feature);
          if (inside === true) {
            emoji = this._getEmoji(feature, this.options);
            break;
          }
        }
        if (!emoji) {
          emoji = this._getEmoji(null, this.options);
        }
        line.push(emoji);
      }
      values.push(line);
    }

    // console.log(values)

    this._layer.setGrid(values, viewportWidth, viewportHeight);
  },

  _getEmojiMethod: function(options) {
    if (typeof (options.emoji) === 'function') {
      return this._getEmojiFunction;
    } else if (typeof (options.emoji) === 'string') {
      return this._getEmojiString;
    } else if (options.emoji.property && (options.emoji.values || options.emoji.classes)) {
      return this._getEmojiObject;
    } else {
      throw new Error('the fuck you\'re doing man');
    }
  },

  _getEmojiFunction: function(feature, options) {
    return options.emoji(feature);
  },

  _getEmojiString: function(feature, options) {
    return (feature) ? options.emoji : options.emptyEmoji;
  },

  _getEmojiObject: function(feature, options) {
    if (feature) {
      var value = feature.properties[options.emoji.property];
      if (value !== undefined) {
        if (options.emoji.values) {
          if (options.emoji.values[value]) {
            return options.emoji.values[value];
          } else {
            if (options.emoji.defaultValue) {
              return options.emoji.defaultValue;
            }
          }
        }
        else if (options.emoji.classes) {
          return this._getClassFromValue(value, options.emoji.classes);
        }
      } else if (options.emoji.defaultValue) {
        return options.emoji.defaultValue;
      }
    } else {
      if (options.emoji.emptyValue) {
        return options.emoji.emptyValue;
      }
    }
    return EMPTY;
  },

  _getClassFromValue: function(value, classes) {
    for (var i = 0; i < classes.breaks.length; i++) {
      if (value < classes.breaks[i]) {
        return classes.emojis[i];
      }
    }
    return classes.emojis[classes.emojis.length - 1];
  },

  _matchShortcodes: function(options) {
    if (typeof (options.emoji) === 'string') {
      options.emoji = getShortcode(options.emoji);
    } else if (options.emoji.property && options.emoji.values) {
      Object.keys(options.emoji.values).forEach(function(value) {
        options.emoji.values[value] = this._getShortcode(options.emoji.values[value]);
      }.bind(this));

      if (options.emoji.defaultValue) {
        options.emoji.defaultValue = this._getShortcode(options.emoji.defaultValue);
      }
      if (options.emoji.emptyValue) {
        options.emoji.emptyValue = this._getShortcode(options.emoji.emptyValue);
      }
    }

    return options;
  },

  _getShortcode: function(emoji) {
    var shortcode = L.Emoji.SHORTCODES[emoji];
    if (shortcode) {
      return String.fromCodePoint.apply(null, shortcode);
    }
    return emoji;
  }
});


var EmojiLayer = L.Layer.extend({

  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  onRemove: function() {
    this._map.off('moveend', this._onMove, this);
    this._map.getPanes().overlayPane.removeChild(this._el);
  },

  onAdd: function(map) {
    this._map = map;
    var classes = 'leaflet-emoji leaflet-zoom-hide';
    this._el = L.DomUtil.create('textarea', classes);
    this._el.style.position = 'absolute';
    this._el.style.margin = 0;
    this._el.style.zIndex = 0;
    this._el.style.fontSize = this.options.size + 'px';
    this._el.style.lineHeight = 1;
    this._el.style.background = 'none';
    this._el.style.border = 'none';
    this._el.innerHTML = '';
    //http://stackoverflow.com/questions/18259090/textarea-word-wrap-only-on-line-breaks
    this._el.setAttribute('wrap', 'off');

    this._map.getPanes().overlayPane.appendChild(this._el);

    // TODO also fire on animation?
    this._map.on('moveend', this._onMove, this);
  },

  setGrid: function(grid, w, h) {
    this._el.style.width = w + 'px';
    this._el.style.height = h + 'px';

    this._grid = grid.map(function(line) {
      return line.join('');
    }).join('\n');

    this._el.innerHTML = this._grid;
  },

  getGrid: function() {
    return this._grid;
  },

  copyGrid: function() {
    this._el.select();
    document.execCommand('copy');
    this._el.selectionStart = this._el.selectionEnd = -1;
  },

  _onMove: function() {
    this._el.style.transform = _invertTranslate3D(this._map._mapPane.style.transform);
  }
});

var _invertTranslate3D = function(originalTransform) {
  var replacer = function (full, xStr, yStr) {
    var x = -parseInt(xStr);
    var y = -parseInt(yStr);
    return 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
  };
  return originalTransform.replace(/translate3d\((-?\d+)px, (-?\d+)px.+\)/, replacer);
};


L.emoji = function(geoJSON, options) {
  return new L.Emoji(geoJSON, options);
};

L.Emoji.SHORTCODES = shortcodes;

L.Emoji.EMPTY = EMPTY;

L.Emoji.getShortcode = getShortcode;

}());
