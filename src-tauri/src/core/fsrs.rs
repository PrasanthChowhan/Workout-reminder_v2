use chrono::{DateTime, Utc};
use rs_fsrs::{Card, Rating, State, FSRS};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FsrsState {
    pub due_date: DateTime<Utc>,
    pub stability: f64,
    pub difficulty: f64,
    pub elapsed_days: u64,
    pub scheduled_days: u64,
    pub reps: u32,
    pub lapses: u32,
    pub state: u32, // 0 = New, 1 = Learning, 2 = Review, 3 = Relearning
    pub last_review: Option<DateTime<Utc>>,
}

impl Default for FsrsState {
    fn default() -> Self {
        Self {
            due_date: Utc::now(),
            stability: 0.0,
            difficulty: 0.0,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: 0,
            lapses: 0,
            state: 0,
            last_review: None,
        }
    }
}

pub fn next_interval(stability: f64) -> u64 {
    let interval = stability.round() as u64;
    interval.max(1)
}

pub fn review(mut state: FsrsState, rating: u32, now: DateTime<Utc>) -> FsrsState {
    let fsrs = FSRS::default();
    
    // Convert FsrsState database model to rs-fsrs Card struct
    let card = Card {
        due: state.due_date,
        stability: state.stability,
        difficulty: state.difficulty,
        elapsed_days: state.elapsed_days as i64,
        scheduled_days: state.scheduled_days as i64,
        reps: state.reps as i32,
        lapses: state.lapses as i32,
        state: match state.state {
            0 => State::New,
            1 => State::Learning,
            2 => State::Review,
            3 => State::Relearning,
            _ => State::New,
        },
        last_review: state.last_review.unwrap_or(now),
    };
    
    let rating_enum = match rating {
        1 => Rating::Again,
        2 => Rating::Hard,
        3 => Rating::Good,
        4 => Rating::Easy,
        _ => Rating::Easy,
    };
    
    let record_log = fsrs.repeat(card, now);
    if let Some(scheduling_info) = record_log.get(&rating_enum) {
        let new_card = &scheduling_info.card;
        
        state.due_date = new_card.due;
        state.stability = new_card.stability;
        state.difficulty = new_card.difficulty;
        state.elapsed_days = new_card.elapsed_days as u64;
        state.scheduled_days = new_card.scheduled_days as u64;
        state.reps = new_card.reps as u32;
        state.lapses = new_card.lapses as u32;
        state.state = match new_card.state {
            State::New => 0,
            State::Learning => 1,
            State::Review => 2,
            State::Relearning => 3,
        };
        state.last_review = Some(new_card.last_review);
    } else {
        // Fallback in case of unexpected map error
        state.reps += 1;
        state.last_review = Some(now);
        if rating == 1 {
            state.lapses += 1;
            state.state = 3;
            state.stability = 0.5;
            state.difficulty = 5.0;
        } else {
            state.state = 2;
            state.stability = 2.0;
            state.difficulty = 3.0;
        }
        state.scheduled_days = next_interval(state.stability);
        state.due_date = now + chrono::Duration::days(state.scheduled_days as i64);
    }
    
    state
}
