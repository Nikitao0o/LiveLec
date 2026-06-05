import Foundation

struct Question: Identifiable, Hashable {
    let id: Int
    let text: String
    let likesCount: Int
    let isLikedByCurrentUser: Bool

    func likedByCurrentUser() -> Question {
        Question(
            id: id,
            text: text,
            likesCount: likesCount + (isLikedByCurrentUser ? 0 : 1),
            isLikedByCurrentUser: true
        )
    }

    func updatingLikes(_ count: Int) -> Question {
        Question(
            id: id,
            text: text,
            likesCount: count,
            isLikedByCurrentUser: isLikedByCurrentUser
        )
    }
}
