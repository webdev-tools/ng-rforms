import { Injectable } from '@angular/core';

/**
 * Class to abstract get and set values from an object or an array
 * using dot-notation string as the path to the property
 *
 */
@Injectable()
export class NgRFModelSetterService {

  /**
   * Get a value using a dot-notation string to find the nested property
   *
   * @param path Dot notation of the value to be get
   * @param model An object or an Array
   * @param separator An optional param to specify a different separator, default '.'
   *
   * ```typescript
   * const rfModelData = {
   *    user: {
   *        name: 'John Doe'
   *    }
   * };
   * nestedProps.getValue('user.name', rfModelData);
   * // => 'John Doe'
   *
   * nestedProps.getValue('user.email', rfModelData);
   * // => null
   * ```
   */
  getValue(path: string, model: any | any[], separator = '.'): any | null {
    if (path == null || !model) {
      return null;
    }

    try {
      const pathPieces = this.generatePathPieces(path, separator);
      return pathPieces.reduce(this.piecesReducer, model) || null;
    } catch (err) {
      return null;
    }
  }


  /**
   * @ignore
   *
   * Return the value associated to the given key.
   *
   * If the key is empty, the last element of an array is returned
   */
  private piecesReducer(obj: any[]|any, key: string): any|any[] {
    return key === '' ? obj.slice(-1)[0] : obj[key];
  }


  /**
   * Set a value using a dot-notation string.
   *
   * If the property does not exists, the entire path will be created.
   *
   * @param path Dot notation of the value to be get
   * @param value The value to be set
   * @param model An object or an Array
   * @param separator An optional param to specify a different separator, default '.'
   *
   * ```typescript
   * nestedProps.setValue('user.age', 35, { user: { name: 'John Doe' } });
   * ```
   */// TODO remove the empty key feature, force users to define the desired array key
  setValue(path: string, value: any, model: object | any[], separator = '.'): void {
    if (!(path && model)) {
      return null;
    }

    try {
      const pathPieces = this.generatePathPieces(path, separator);
      const finalKey = pathPieces.pop();
      (<any>pathPieces)['finalKey'] = finalKey;

      const targetProp = pathPieces.reduce(this.getTargetPropToSet, model) || null;

      if (finalKey === '') {
        targetProp.push(value);
      } else {
        targetProp[finalKey] = value;
      }
    } catch (err) {
      console.error('NestedProps setValue error: ', err);
    }
  }


  /**
   * Get the final property of the dot notation path.
   * This will be the property that will receive the new value
   */
  private getTargetPropToSet = (obj: any, key: string, i: number, pathPieces: any): any[]|any => {
    let prop = obj[key];

    if (!prop) {
      const nextKey = pathPieces[i + 1] || pathPieces['finalKey'];

      prop = (nextKey != null && this.isArrayKey(nextKey)) ? [] : {};
      obj[key] = prop;
    }

    return prop;
  }


  /**
   * @ignore
   * Internal function to define if a given key is for an array or an object
   */
  private isArrayKey(key: string): boolean {
    return key === '' || !isNaN(parseInt(key, 10));
  }


  /**
   * Generate the dot-notation path as an Array to iterate over.
   */
  private generatePathPieces(path: string, separator: string): string[] {
    return path
      .replace('[', separator)
      .replace(']', '')
      .split(separator);
  }

}