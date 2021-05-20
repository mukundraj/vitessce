import centroid from '@turf/centroid';
import { featureCollection as turfFeatureCollection, point as turfPoint } from '@turf/helpers';

import cells from '../schemas/cells.schema.json';
import JsonLoader from './JsonLoader';
import { LoaderFetchError, LoaderValidationError } from './errors/index';

export default class GeoJsonJsonLoader extends JsonLoader {
  constructor(params) {
    super(params);
    this.schema = cells;
  }

  loadJson() {
    const {
      url, requestInit, type, fileType,
    } = this;
    return fetch(url, requestInit).then(async (response) => {
      if (response.ok) {
        const geoJson = await response.json();
        const cellsJson = {};
        if (!(geoJson.every(cell => cell.geometry.type === 'Polygon')
          || geoJson.every(cell => cell.geometry.type === 'Point'))) {
          const reason = 'Vitessce only accepts GeoJSON that is excusively Points (i.e centroids) or Polygons';
          return Promise.reject(new LoaderValidationError(type, fileType, url, reason));
        }
        geoJson.forEach((cell, index) => {
          if (cell.geometry.type === 'Polygon') {
            const points = turfFeatureCollection(
              cell.geometry.coordinates[0].map(turfPoint),
            );
            cellsJson[String(index)] = {
              poly: cell.geometry.coordinates[0],
              xy: centroid(points).geometry.coordinates,
            };
          } else {
            cellsJson[String(index)] = {
              xy: cell.geometry.coordinates[0],
            };
          }
        });
        console.log(cellsJson); // eslint-disable-line
        return cellsJson;
      }
      return Promise.reject(
        new LoaderFetchError(type, fileType, url, response.headers),
      );
    });
  }
}