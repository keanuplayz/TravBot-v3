export class GenericWrapper<T> {
  protected readonly value: T;

  public constructor(value: T) {
    this.value = value;
  }
}

export class NumberWrapper extends GenericWrapper<number> {
  /**
   * Pluralises a word and chooses a suffix attached to the root provided.
   * - pluralise("credit", "s") = credit/credits
   * - pluralise("part", "ies", "y") = party/parties
   * - pluralise("sheep") = sheep
   */
  public pluralise(
    word: string,
    plural = '',
    singular = '',
    excludeNumber = false,
  ): string {
    let result = excludeNumber ? '' : `${this.value} `;

    if (this.value === 1) result += word + singular;
    else result += word + plural;

    return result;
  }

  /**
   * Pluralises a word for changes.
   * - (-1).pluraliseSigned() = '-1 credits'
   * - (0).pluraliseSigned() = '+0 credits'
   * - (1).pluraliseSigned() = '+1 credit'
   */
  public pluraliseSigned(
    word: string,
    plural = '',
    singular = '',
    excludeNumber = false,
  ): string {
    const sign = this.value >= 0 ? '+' : '';
    return `${sign}${this.pluralise(word, plural, singular, excludeNumber)}`;
  }
}

export class StringWrapper extends GenericWrapper<string> {
  public replaceAll(before: string, after: string): string {
    let result = this.value;

    while (result.indexOf(before) !== -1)
      result = result.replace(before, after);

    return result;
  }

  public toTitleCase(): string {
    return this.value.replace(
      /([^\W_]+[^\s-]*) */g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  }
}

export class ArrayWrapper<T> extends GenericWrapper<T[]> {
  /** Returns a random element from this array. */
  public random(): T {
    return this.value[Math.floor(Math.random() * this.value.length)];
  }

  /**
   * Splits up this array into a specified length.
   * `$([1,2,3,4,5,6,7,8,9,10]).split(3)` = `[[1,2,3],[4,5,6],[7,8,9],[10]]`
   */
  public split(lengthOfEachSection: number): T[][] {
    const amountOfSections = Math.ceil(this.value.length / lengthOfEachSection);
    const sections: T[][] = new Array(amountOfSections);

    for (let index = 0; index < amountOfSections; index++)
      sections[index] = this.value.slice(
        index * lengthOfEachSection,
        (index + 1) * lengthOfEachSection,
      );

    return sections;
  }
}
