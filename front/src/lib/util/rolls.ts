export function rollRange(min: number, max: number) {
  if (min > max) throw `${min} can't be greater than ${max}`;
  return min + Math.round((max - min) * Math.random());
}
export function roll<T>(options: Array<[T, number]>): T {
  let total_weight = 0;
  // log_message(options);
  options.forEach(function (choice, index) {
    if (choice[1] > 0) {
      total_weight = total_weight + Math.round(choice[1]);
    }
  });
  let roll_choice = rollRange(1, total_weight);
  // log_message(roll_choice)
  for (let i = 0; i < options.length; i++) {
    let choice = options[i];
    if (choice[1] >= roll_choice) {
      // log_message('returning ' + choice[0])
      return choice[0];
    } else {
      roll_choice = roll_choice - choice[1];
    }
  }
  return options[0][0];
}

export function pick<T>(a: Array<T>): T {
  return a[Math.floor(Math.random() * a.length)];
}
